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

    logging.debug(
        f"/create_product -> received title={title}, description={description}, "
        f"price={price}, currency={currency}, image={image}"
    )

    if not all([image, title, description, price, currency]):
        return jsonify({"error": "all fields required"}), 400

    if len(title) > 50 or len(description) > 500:
        return jsonify({"error": "field limit exceeded"}), 400

    try:
        price = float(price)
    except ValueError:
        return jsonify({"error": "invalid price"}), 400

    if price < 0.001 or price > 1_000_000:
        return jsonify({"error": "invalid price (0.001 - 1,000,000)"}), 400

    # ---------- AWS S3 UPLOAD ----------
    try:
        filename = secure_filename(image.filename)
        file_key = f"products/{uuid.uuid4()}_{filename}"

        s3.upload_fileobj(
    image,
    AWS_BUCKET,
    file_key,
    ExtraArgs={
        "ContentType": image.mimetype,
    },
)


        image_url = f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{file_key}"
        logging.debug(f"/create_product -> image uploaded to S3: {image_url}")

    except ClientError as e:
        logging.exception(f"/create_product -> S3 upload failed: {e}")
        return jsonify({"error": "failed to upload image"}), 500

    products.insert_one({
        "wallet": wallet,
        "title": title,
        "description": description,
        "price": price,
        "currency": currency,
        "image": image_url,
        "created_at": datetime.utcnow()
    })

    logging.debug("/create_product -> product saved to DB")

    return jsonify({
        "status": "ok",
        "image": image_url
    })

@app.route("/products", methods=["GET"])
def get_products():
    items = products.find().sort("created_at", -1)

    result = []
    for item in items:
        result.append({
            "wallet": item.get("wallet"),
            "id": str(item["_id"]),
            "title": item.get("title"),
            "description": item.get("description"),
            "price": item.get("price"),
            "currency": item.get("currency"),
            "image": item.get("image"),
            "created_at": item.get("created_at")
        })

    return jsonify({
        "products": result
    })

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

if __name__ == "__main__":
    app.run(debug=True)
