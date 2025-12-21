from pymongo.mongo_client import MongoClient
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import jwt
from werkzeug.utils import secure_filename
import uuid
import io
import logging
import boto3
from botocore.exceptions import ClientError
from bson.objectid import ObjectId
import requests
import time
import threading

# ---------------- CONFIG ----------------
load_dotenv()
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("JWT_SECRET")

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

db_password = os.getenv("DB_PASSWORD")
uri = f"mongodb+srv://neonflick-bps:{db_password}@cluster0.mhunksj.mongodb.net/?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database("neonflick-bps")
users = db.get_collection("users")
products = db.get_collection("products")
expired_products = db.get_collection("expired_products")

# ---------- LOGGING ----------
logging.basicConfig(level=logging.DEBUG)

AWS_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION")

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)

DELETE_PRODUCT_URL = "http://127.0.0.1:5000/delete-product"  # твій існуючий роут
CHECK_INTERVAL = 60  # перевірка кожні 60 секунд

# ---------------- HELPERS ----------------
def decode_token():
    """Decode JWT from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        logging.debug("decode_token -> no Authorization header")
        return None
    try:
        token_type, token = auth_header.split()
        if token_type.lower() != "bearer":
            logging.debug("decode_token -> token type not Bearer")
            return None
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        return payload
    except Exception as e:
        logging.debug(f"decode_token -> failed to decode token: {e}")
        return None

def calculate_sol_commission(price: float) -> float:
    """
    Формула комісії на SOL:
    0.001 – 0.01   → 10%
    0.01 – 0.1     → 5%
    0.1 – 1        → 1%
    1 – 100        → 0.25%
    > 100          → 0.25 SOL fixed
    """
    if price < 0.01:
        return max(price * 0.10, 0.0001)
    elif price < 0.1:
        return price * 0.05
    elif price < 1:
        return price * 0.01
    elif price <= 100:
        return price * 0.0025
    else:
        return 0.25

def expired_products_checker():
    while True:
        try:
            now = datetime.utcnow()
            expired_items = products.find({"expires_at": {"$lte": now}})

            for item in expired_items:
                product_id = str(item["_id"])
                
                try:
                    requests.post("http://127.0.0.1:5000/delete-product", json={"id": product_id})
                except Exception as e:
                    print(f"Error deleting product {product_id}: {e}")

        except Exception as e:
            print(f"Checker error: {e}")

        time.sleep(60)  # перевіряємо кожні 30 секунд (налаштовується)
        

# 🔹 Запуск фоновго потоку після створення Flask app
threading.Thread(target=expired_products_checker, daemon=True).start()


# ---------------- ROUTES ----------------
@app.route("/")
def root():
    return jsonify({"name": "Neonflick-bps", "status": "backend running"})


@app.route("/auth/wallet", methods=["POST"])
def auth_wallet():
    data = request.json
    wallet = data.get("wallet")
    logging.debug(f"/auth/wallet -> wallet: {wallet}")

    if not wallet or not isinstance(wallet, str):
        return jsonify({"error": "wallet must be string"}), 400

    user = users.find_one({"wallet": wallet})
    if not user:
        users.insert_one({"wallet": wallet, "created_at": datetime.utcnow(), "last_login": datetime.utcnow()})
        status = "created"
    else:
        users.update_one({"wallet": wallet}, {"$set": {"last_login": datetime.utcnow()}})
        status = "login"

    token = jwt.encode(
        {"wallet": wallet, "exp": datetime.utcnow() + timedelta(days=7)},
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return jsonify({"status": status, "user": {"wallet": wallet}, "token": token})


@app.route("/auth/me", methods=["GET"])
def auth_me():
    payload = decode_token()
    logging.debug(f"/auth/me -> payload: {payload}")

    if not payload:
        return jsonify({"user": None}), 200

    wallet = payload.get("wallet")
    user = users.find_one({"wallet": wallet})
    logging.debug(f"/auth/me -> user from DB: {user}")

    if not user:
        return jsonify({"user": None}), 200

    return jsonify({"user": {"wallet": wallet}})



# ---------- Роут створення продукту ----------
@app.route("/create_product", methods=["POST"])
def create_product():
    payload = decode_token()
    logging.debug(f"/create_product -> payload: {payload}")

    if not payload:
        return jsonify({"error": "unauthorized"}), 401

    wallet = payload.get("wallet")
    logging.debug(f"/create_product -> wallet: {wallet}")

    image = request.files.get("image")
    title = request.form.get("title")
    description = request.form.get("description")
    price = request.form.get("price")
    currency = request.form.get("currency")
    duration_value = request.form.get("duration")  # 🔹 нове поле для тривалості
    created_at = datetime.utcnow()

    logging.debug(
        f"/create_product -> received title={title}, description={description}, "
        f"price={price}, currency={currency}, duration={duration_value}, image={image}"
    )

    # перевірки
    if not all([image, title, description, price, currency, duration_value]):
        return jsonify({"error": "all fields required"}), 400

    if len(title) > 50 or len(description) > 1000:
        return jsonify({"error": "field limit exceeded"}), 400

    try:
        price = float(price)
    except ValueError:
        return jsonify({"error": "invalid price"}), 400

    if price < 0.001 or price > 9_999_999:
        return jsonify({"error": "invalid price (0.001 - 9,999,999)"}), 400

    # ---------- AWS S3 UPLOAD ----------
    try:
        filename = secure_filename(image.filename)
        file_key = f"products/{uuid.uuid4()}_{filename}"

        s3.upload_fileobj(
            image,
            AWS_BUCKET,
            file_key,
            ExtraArgs={"ContentType": image.mimetype},
        )

        image_url = f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{file_key}"
        logging.debug(f"/create_product -> image uploaded to S3: {image_url}")

    except ClientError as e:
        logging.exception(f"/create_product -> S3 upload failed: {e}")
        return jsonify({"error": "failed to upload image"}), 500

    # ---------- Розрахунок комісії ----------
    commission = calculate_sol_commission(price)

    # ---------- Розрахунок expires_at ----------
    duration_map = {
        "3h": timedelta(hours=3),
        "6h": timedelta(hours=6),
        "12h": timedelta(hours=12),
        "1d": timedelta(days=1),
        "3d": timedelta(days=3)
    }

    if duration_value not in duration_map:
        return jsonify({"error": "invalid duration"}), 400

    expires_at = created_at + duration_map[duration_value]

    # ---------- Додавання продукту в базу ----------
    products.insert_one({
        "wallet": wallet,
        "title": title,
        "description": description,
        "price": price,
        "currency": currency,
        "commission": commission,
        "stats": {"status": "new", "count": 0},
        "image": image_url,
        "created_at": created_at,
        "expires_at": expires_at
    })

    logging.debug("/create_product -> product saved to DB")

    return jsonify({
        "status": "ok",
        "image": image_url,
        "commission": commission,
        "expires_at": expires_at.isoformat()
    })

# ---------- Роут для обчислення комісії на Sol ----------
@app.route("/calculate_commission_sol", methods=["GET"])
def calculate_commission_sol():
    price = request.args.get("price")
    if not price:
        return jsonify({"error": "price required"}), 400
    try:
        price = float(price)
    except ValueError:
        return jsonify({"error": "invalid price"}), 400

    if price < 0.001 or price > 9_999_999:
        return jsonify({"error": "price out of range (0.001 - 9,999,999)"}), 400

    commission = calculate_sol_commission(price)
    commission = round(commission, 4)

    return jsonify({"price": price, "commission": commission})



from datetime import datetime
from flask import jsonify

@app.route("/products", methods=["GET"])
def get_products():
    items = products.find().sort("created_at", -1)
    result = []

    for item in items:
        created_at_raw = item.get("created_at")

        # Перетворюємо у datetime, якщо це ще не рядок у потрібному форматі
        if isinstance(created_at_raw, datetime):
            created_at_str = created_at_raw.strftime("%d.%m.%Y")
        else:
            try:
                # спробуємо розпарсити рядок у datetime
                created_at_dt = datetime.fromisoformat(created_at_raw)
                created_at_str = created_at_dt.strftime("%d.%m.%Y")
            except Exception:
                # якщо не вдалося, залишаємо як є
                created_at_str = str(created_at_raw)

        result.append({
            "wallet": item.get("wallet"),
            "id": str(item["_id"]),
            "title": item.get("title"),
            "description": item.get("description"),
            "price": item.get("price"),
            "currency": item.get("currency"),
            "image": item.get("image"),
            "created_at": created_at_str,
            "expires_at": item.get("expires_at")
        })

    return jsonify({"products": result})


@app.route("/delete-product", methods=["POST"])
def delete_product():
    data = request.json
    product_id = data.get("id")
    s3_key = data.get("s3_key")  # ключ файлу на S3, напр. "products/filename.jpg"

    if not product_id or not s3_key:
        return jsonify({"error": "Missing id or s3_key"}), 400

    try:
        # Конвертуємо рядок у ObjectId
        mongo_id = ObjectId(product_id)
    except Exception as e:
        return jsonify({"error": "Invalid product id"}), 400

    # 1. Видалити з MongoDB
    result = products.delete_one({"_id": mongo_id})

    if result.deleted_count == 0:
        return jsonify({"error": "Product not found"}), 404

    # 2. Видалити файл з S3
    try:
        s3.delete_object(Bucket=AWS_BUCKET, Key=s3_key)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"success": True})

@app.route("/update_product", methods=["POST"])
def update_product():
    data = request.form
    product_id = data.get("id")

    if not product_id:
        return jsonify({"error": "Product ID required"}), 400

    product = products.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # Перевірка обов'язкових полів
    required_fields = ["title", "description", "price", "currency"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    try:
        price = float(data["price"])
    except ValueError:
        return jsonify({"error": "Invalid price"}), 400

    currency = data["currency"]
    # 🔹 Розрахунок комісії тільки для SOL
    commission = None
    if currency.upper() == "SOL":
        try:
            commission = calculate_sol_commission(price)
        except Exception as e:
            print(f"Error calculating commission: {e}")
            commission = None

    update_data = {
        "title": data["title"],
        "description": data["description"],
        "price": price,
        "currency": currency,
        "commission": commission,
    }

    # 🔹 Обробка заміни картинки
    if "image" in request.files:
        old_image_url = data.get("old_image")
        if old_image_url:
            try:
                old_key = "/".join(old_image_url.split("/")[-2:])
                s3.delete_object(Bucket=AWS_BUCKET, Key=old_key)
            except Exception as e:
                print(f"Failed to delete old image: {e}")

        file = request.files["image"]
        filename = f"products/{uuid.uuid4()}_{file.filename}"
        try:
            s3.upload_fileobj(
                file,
                AWS_BUCKET,
                filename,
                ExtraArgs={"ContentType": file.content_type},
            )
            update_data["image"] = f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{filename}"
        except Exception as e:
            return jsonify({"error": "Failed to upload new image"}), 500

    # 🔹 Оновлення продукту в базі
    products.update_one({"_id": ObjectId(product_id)}, {"$set": update_data})

    return jsonify({"success": True, "commission": commission})


@app.route("/delete-products", methods=["POST"])
def delete_products():
    """
    Масове видалення продуктів
    JSON body:
    {
        "ids": ["id1", "id2", ...]
    }
    """
    data = request.json
    ids = data.get("ids", [])

    if not ids or not isinstance(ids, list):
        return jsonify({"error": "Missing or invalid ids"}), 400

    deleted_ids = []
    errors = []

    for product_id in ids:
        try:
            mongo_id = ObjectId(product_id)
        except Exception:
            errors.append({"id": product_id, "error": "Invalid ObjectId"})
            continue

        # знайти продукт
        product = products.find_one({"_id": mongo_id})
        if not product:
            errors.append({"id": product_id, "error": "Product not found"})
            continue

        # видалити з MongoDB
        result = products.delete_one({"_id": mongo_id})
        if result.deleted_count == 0:
            errors.append({"id": product_id, "error": "Delete failed"})
            continue

        # видалити з S3
        s3_key = "/".join(product["image"].split("/")[-2:])
        try:
            s3.delete_object(Bucket=AWS_BUCKET, Key=s3_key)
            deleted_ids.append(product_id)
        except Exception as e:
            errors.append({"id": product_id, "error": str(e)})

    return jsonify({"deleted": deleted_ids, "errors": errors})


if __name__ == "__main__":
    app.run(debug=True)
