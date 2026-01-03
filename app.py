from pymongo.mongo_client import MongoClient
from flask import Flask, jsonify, request, abort, send_file
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
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
from solana.rpc.api import Client
from solana.publickey import PublicKey
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from mailjet_rest import Client

load_dotenv()
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("JWT_SECRET")
FRONTEND = os.getenv("FRONTEND")

CORS(app, supports_credentials=True, origins=[FRONTEND])

db_password = os.getenv("DB_PASSWORD")
uri = f"mongodb+srv://neonflick-bps:{db_password}@cluster0.mhunksj.mongodb.net/?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database("neonflick-bps")
users = db.get_collection("users")
products = db.get_collection("products")
blocked_users = db.get_collection("blocked_users")

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

PLATFORM_WALLET_SOL = os.getenv("PLATFORM_WALLET_ADDRESS_SOL")
SOLANA_NETWORK = os.getenv("SOLANA_NETWORK")

MJ_APIKEY_PUBLIC = os.getenv("MJ_APIKEY_PUBLIC")
MJ_APIKEY_PRIVATE = os.getenv("MJ_APIKEY_PRIVATE")
MAILJET_FROM_EMAIL = os.getenv("MAILJET_FROM_EMAIL")
MAILJET_FROM_NAME = os.getenv("MAILJET_FROM_NAME")

mj_api_key = os.getenv("MJ_APIKEY_PUBLIC")
mj_api_secret = os.getenv("MJ_APIKEY_PRIVATE")

mailjet = Client(auth=(mj_api_key, mj_api_secret), version="v3.1")


# ---------------- HELPERS ----------------
def decode_token():
    """Decode JWT from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    try:
        token_type, token = auth_header.split()
        if token_type.lower() != "bearer":
            return None
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        return payload
    except Exception as e:
        return None

def calculate_sol_commission(price: float) -> float:
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
    print("🔥 Expired products checker started")

    while True:
        try:
            now = datetime.utcnow()
            expired_items = products.find({"expires_at": {"$lte": now}})

            for item in expired_items:
                product_id = item["_id"]
                s3_key = item.get("s3_key")

                if not s3_key:
                    print(f"❌ No s3_key for {product_id}")
                    continue

                try:
                    s3.head_object(
                        Bucket=AWS_BUCKET,
                        Key=s3_key
                    )
                except Exception as e:
                    print(f"❌ FILE NOT FOUND in S3: {s3_key}")
                    continue

                s3.delete_object(
                    Bucket=AWS_BUCKET,
                    Key=s3_key
                )

                products.delete_one({"_id": product_id})

                print(f"✅ Fully deleted {product_id}")

        except Exception as e:
            print(f"Checker error: {e}")

        time.sleep(60)

def is_wallet_blocked(wallet: str) -> bool:
    return bool(blocked_users.find_one({"wallet": wallet}))

threading.Thread(target=expired_products_checker, daemon=True).start()

# ---------------- ROUTES ----------------
@app.route("/")
def root():
    return jsonify({"name": "Neonflick-bps", "status": "backend running"})

@app.route("/auth/wallet", methods=["POST"])
def auth_wallet():
    data = request.json or {}
    wallet = data.get("wallet")
    consent = data.get("consent", False)

    if not wallet or not isinstance(wallet, str):
        return jsonify({"error": "wallet must be string"}), 400

    if not isinstance(consent, bool):
        return jsonify({"error": "consent must be boolean"}), 400

    if is_wallet_blocked(wallet):
        return jsonify({
            "error": "wallet_blocked",
            "message": "This wallet address is blocked from using the platform."
        }), 403

    user = users.find_one({"wallet": wallet})
    now = datetime.utcnow()

    consents = []

    if not user:

        consents.append("privacy_policy")

        users.insert_one({
            "wallet": wallet,
            "created_at": now,
            "last_login": now,
            "consents": consents,
            "consent_given_at": {c: now for c in consents}
        })
        status = "created"

    else:
        update_fields = {"last_login": now}
        user_consents = user.get("consents", [])

        if consent and "crypto_risk_disclosure" not in user_consents:
            user_consents.append("crypto_risk_disclosure")
            update_fields["consents"] = user_consents

            consent_times = user.get("consent_given_at", {})
            consent_times["crypto_risk_disclosure"] = now
            update_fields["consent_given_at"] = consent_times

        users.update_one({"wallet": wallet}, {"$set": update_fields})
        status = "login"

    token = jwt.encode(
        {"wallet": wallet, "exp": now + timedelta(days=7)},
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return jsonify({
        "status": status,
        "user": {"wallet": wallet},
        "token": token
    }), 200

@app.route("/auth/me", methods=["GET"])
def auth_me():
    payload = decode_token()

    if not payload:
        return jsonify({"user": None}), 200

    wallet = payload.get("wallet")
    if not wallet:
        return jsonify({"user": None}), 200

    if is_wallet_blocked(wallet):
        return jsonify({"user": None}), 200

    user = users.find_one({"wallet": wallet})
    if not user:
        return jsonify({"user": None}), 200

    return jsonify({
        "user": {
            "wallet": wallet,
            "consents": user.get("consents", []),
            "consent_given_at": user.get("consent_given_at", {})
        }
    }), 200

@app.route("/auth/consent/check", methods=["POST"])
def check_required_consents():
    data = request.json
    wallet = data.get("wallet")

    if not wallet or not isinstance(wallet, str):
        return jsonify({"error": "wallet must be string"}), 400

    if is_wallet_blocked(wallet):
        return jsonify({
            "error": "wallet_blocked",
            "message": "This wallet address is blocked from using the platform."
        }), 403

    user = users.find_one({"wallet": wallet})
    if not user:
        return jsonify({"error": "user not found"}), 404

    consents = user.get("consents", [])

    return jsonify({
        "terms": "terms" in consents,
        "crypto_risk_disclosure": "crypto_risk_disclosure" in consents,

        "aml": "aml" in consents,
        "platform_disclaimer": "platform_disclaimer" in consents,
    }), 200

@app.route("/auth/consent", methods=["POST"])
def add_consent():
    data = request.json
    wallet = data.get("wallet")
    consent = data.get("consent")

    if not wallet or not isinstance(wallet, str):
        return jsonify({"error": "wallet must be string"}), 400
    if not consent or not isinstance(consent, str):
        return jsonify({"error": "consent must be string"}), 400

    if is_wallet_blocked(wallet):
        return jsonify({
            "error": "wallet_blocked",
            "message": "This wallet address is blocked."
        }), 403

    now = datetime.utcnow()

    result = users.update_one(
        {"wallet": wallet},
        {
            "$addToSet": {"consents": consent},
            "$set": {f"consent_given_at.{consent}": now}
        }
    )

    if result.matched_count == 0:
        return jsonify({"error": "user not found"}), 404

    return jsonify({"status": "ok"}), 200


# ---------- Роут створення продукту ----------
@app.route("/create_product", methods=["POST"])
def create_product():
    payload = decode_token()

    if not payload:
        return jsonify({"error": "unauthorized"}), 401

    wallet = payload.get("wallet")
    if not wallet:
        return jsonify({"error": "unauthorized"}), 401

    if is_wallet_blocked(wallet):
        return jsonify({
            "error": "wallet_blocked",
            "message": "This wallet address is blocked from using the platform."
        }), 403

    image = request.files.get("image")
    title = request.form.get("title")
    description = request.form.get("description")
    price = request.form.get("price")
    currency = request.form.get("currency")
    duration_value = request.form.get("duration")
    created_at = datetime.utcnow()

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

    except ClientError as e:
        logging.exception(f"/create_product -> S3 upload failed: {e}")
        return jsonify({"error": "failed to upload image"}), 500

    commission = calculate_sol_commission(price)

    final_price = round(price - commission, 4)

    if final_price <= 0:
        return jsonify({"error": "final price must be greater than 0"}), 400

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

    # ---------- ЗАПИС У БАЗУ ----------
    products.insert_one({
        "wallet": wallet,
        "title": title,
        "description": description,
        "price": price,
        "commission": commission,
        "final_price": final_price,
        "currency": currency,
        "stats": {
            "status": "new",
            "count": 0
        },
        "image": image_url,
        "s3_key": file_key,
        "created_at": created_at,
        "expires_at": expires_at
    })

    return jsonify({
        "status": "ok",
        "image": image_url,
        "s3_key": file_key,
        "price": price,
        "commission": commission,
        "final_price": final_price,
        "currency": currency,
        "expires_at": expires_at.isoformat()
    }), 200


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

    final_price = price - commission

    commission = round(commission, 4)
    final_price = round(final_price, 4)

    return jsonify({
        "price": price,
        "commission": commission,
        "final_price": final_price
    })


@app.route("/products", methods=["GET"])
def get_products():
    payload = decode_token()
    if not payload:
        return jsonify({"products": []}), 200

    wallet = payload.get("wallet")
    if not wallet:
        return jsonify({"products": []}), 200

    if is_wallet_blocked(wallet):
        return jsonify({
            "error": "wallet_blocked",
            "message": "This wallet address is blocked from using the platform."
        }), 403

    items = products.find(
        {"wallet": wallet}
    ).sort("created_at", -1)

    result = []

    for item in items:
        created_at_raw = item.get("created_at")

        if isinstance(created_at_raw, datetime):
            created_at_str = created_at_raw.strftime("%d.%m.%Y")
        else:
            try:
                created_at_dt = datetime.fromisoformat(created_at_raw)
                created_at_str = created_at_dt.strftime("%d.%m.%Y")
            except Exception:
                created_at_str = str(created_at_raw)

        stats = item.get("stats", {})

        result.append({
            "wallet": item.get("wallet"),
            "id": str(item["_id"]),
            "title": item.get("title"),
            "description": item.get("description"),
            "price": item.get("price"),
            "currency": item.get("currency"),
            "image": item.get("image"),
            "created_at": created_at_str,
            "expires_at": item.get("expires_at"),
            "commission": item.get("commission"),
            "final_price": item.get("final_price"),
            "stats": {
                "status": stats.get("status"),
                "count": stats.get("count", 0),
                "transactions": stats.get("transactions", [])
            }
        })

    return jsonify({"products": result}), 200

@app.route("/delete-product", methods=["POST"])
def delete_product():
    data = request.json
    product_id = data.get("id")
    s3_key = data.get("s3_key")

    if not product_id or not s3_key:
        return jsonify({"error": "Missing id or s3_key"}), 400

    try:
        mongo_id = ObjectId(product_id)
    except Exception as e:
        return jsonify({"error": "Invalid product id"}), 400

    result = products.delete_one({"_id": mongo_id})

    if result.deleted_count == 0:
        return jsonify({"error": "Product not found"}), 404

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

    try:
        product = products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        return jsonify({"error": "Invalid product ID"}), 400

    if not product:
        return jsonify({"error": "Product not found"}), 404

    wallet = product.get("wallet")
    if not wallet:
        return jsonify({"error": "Product wallet not found"}), 500

    if is_wallet_blocked(wallet):
        return jsonify({
            "error": "wallet_blocked",
            "message": "This wallet address is blocked from using the platform."
        }), 403

    required_fields = ["title", "description", "price", "currency"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    try:
        price = float(data["price"])
        if price <= 0:
            raise ValueError()
    except ValueError:
        return jsonify({"error": "Invalid price"}), 400

    currency = data["currency"]

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
        "updated_at": datetime.utcnow(),
    }

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
            update_data["image"] = (
                f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{filename}"
            )
        except Exception:
            return jsonify({"error": "Failed to upload new image"}), 500

    products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )

    return jsonify({
        "success": True,
        "commission": commission
    }), 200




@app.route("/delete-products", methods=["POST"])
def delete_products():

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

        product = products.find_one({"_id": mongo_id})
        if not product:
            errors.append({"id": product_id, "error": "Product not found"})
            continue

        result = products.delete_one({"_id": mongo_id})
        if result.deleted_count == 0:
            errors.append({"id": product_id, "error": "Delete failed"})
            continue

        s3_key = "/".join(product["image"].split("/")[-2:])
        try:
            s3.delete_object(Bucket=AWS_BUCKET, Key=s3_key)
            deleted_ids.append(product_id)
        except Exception as e:
            errors.append({"id": product_id, "error": str(e)})

    return jsonify({"deleted": deleted_ids, "errors": errors})

@app.route("/api/pay/<product_id>", methods=["GET"])
def get_payment_data(product_id):
    try:
        product_oid = ObjectId(product_id)
    except Exception:
        abort(400, description="Invalid product id")

    product = products.find_one({"_id": product_oid})
    if not product:
        abort(404, description="Product not found")

    wallet = product.get("wallet")
    if not wallet:
        abort(500, description="Product wallet not found")

    if is_wallet_blocked(wallet):
        return jsonify({
            "error": "wallet_blocked",
            "message": "This wallet address is blocked from using the platform."
        }), 403

    expires_at = product.get("expires_at")
    if not expires_at:
        abort(500, description="Product expiration not set")

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    if now > expires_at:
        abort(410, description="Product expired")

    payment_payload = {
        "product_id": str(product["_id"]),
        "sellerWallet": wallet,
        "price": product["price"],
        "currency": product["currency"],
        "commission": product.get("commission"),
        "expires_at": expires_at.isoformat(),
        "title": product["title"],
        "image": product["image"],
        "description": product.get("description"),
    }

    return jsonify(payment_payload), 200


@app.route("/api/pay/prepare/sol", methods=["POST"])
def prepare_sol_transaction():
    data = request.json or {}
    product_id = data.get("product_id")
    buyer_wallet = data.get("buyer_wallet")

    if not product_id or not buyer_wallet:
        abort(400, description="Missing product_id or buyer_wallet")

    try:
        product = products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        abort(400, description="Invalid product_id")

    if not product:
        abort(404, description="Product not found")

    seller_wallet = product.get("wallet")
    if not seller_wallet:
        abort(500, description="Product wallet not found")

    if is_wallet_blocked(seller_wallet):
        return jsonify({
            "error": "wallet_blocked",
            "message": "Seller wallet is blocked from using the platform."
        }), 403

    expires_at = product.get("expires_at")
    if not expires_at:
        abort(500, description="Product expiration not set")

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    remaining_seconds = int((expires_at - now).total_seconds())

    if remaining_seconds <= 0:
        abort(410, description="Product expired")

    if remaining_seconds < 30:
        abort(409, description="Not enough time left to process transaction")

    price = float(product["price"])
    commission = float(product.get("commission", 0))
    seller_amount = price - commission

    if seller_amount <= 0:
        abort(500, description="Invalid commission configuration")

    LAMPORTS = 1_000_000_000

    buyer = PublicKey(buyer_wallet)
    seller = PublicKey(seller_wallet)
    platform = PublicKey(PLATFORM_WALLET_SOL)

    client = Client(os.getenv("SOLANA_NETWORK"))
    try:
        blockhash_resp = client.get_latest_blockhash()
        blockhash = str(blockhash_resp.value.blockhash)
    except Exception as e:
        abort(500, description=f"Failed to fetch latest blockhash: {e}")

    transfers = []

    if commission > 0:
        transfers.append({
            "to": str(platform),
            "lamports": int(commission * LAMPORTS)
        })

    transfers.append({
        "to": str(seller),
        "lamports": int(seller_amount * LAMPORTS)
    })

    return jsonify({
        "blockhash": blockhash,
        "fee_payer": str(buyer),
        "transfers": transfers,
        "expires_in": remaining_seconds,
    }), 200

@app.route("/api/products/<product_id>/transaction", methods=["POST"])
def add_product_transaction(product_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    tx_hash = data.get("tx_hash")
    consents = data.get("consents")

    if not tx_hash:
        return jsonify({"error": "tx_hash required"}), 400

    if not isinstance(consents, list) or not consents:
        return jsonify({"error": "consents must be a non-empty list"}), 400

    try:
        product_object_id = ObjectId(product_id)
    except Exception:
        return jsonify({"error": "invalid product_id"}), 400

    product = products.find_one({"_id": product_object_id})
    if not product:
        return jsonify({"error": "product not found"}), 404

    stats = product.get("stats", {})
    existing_hashes = [
        t.get("hash") for t in stats.get("transactions", [])
        if isinstance(t, dict)
    ]

    if tx_hash in existing_hashes:
        return jsonify({"error": "transaction already recorded"}), 409

    now_iso = datetime.utcnow().isoformat() + "Z"

    buyer_consents = {
        consent: now_iso for consent in consents
    }

    new_tx = {
        "hash": tx_hash,
        "buyer_consents": buyer_consents
    }

    result = products.update_one(
        {"_id": product_object_id},
        {
            "$set": {"stats.status": "used"},
            "$inc": {"stats.count": 1},
            "$push": {"stats.transactions": new_tx},
        }
    )

    if result.modified_count == 0:
        return jsonify({"error": "update failed"}), 500

    return jsonify({
        "success": True,
        "product_id": product_id,
        "transaction": new_tx
    }), 200

@app.route("/api/send-receipt", methods=["POST"])
def send_receipt():
    data = request.get_json()

    required_fields = [
        "product_id",
        "title",
        "price",
        "currency",
        "sellerWallet",
        "buyer_wallet",
        "tx_hash",
        "image",
        "email"
    ]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # --- Генерація PDF ---
    pdf = FPDF()
    pdf.add_page()
    pdf.set_fill_color(0, 0, 0)
    pdf.rect(0, 0, pdf.w, pdf.h, "F")
    pdf.set_auto_page_break(auto=True, margin=15)

    CYAN = (0, 255, 255)
    WHITE = (255, 255, 255)

    pdf.set_draw_color(*CYAN)
    pdf.set_font("Helvetica", size=12)

    pdf.set_text_color(*CYAN)
    pdf.set_font("Helvetica", style="B", size=18)
    pdf.cell(
        0, 12,
        "Electronic Payment Receipt",
        align="C",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT
    )
    pdf.ln(6)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(8)

    # Додаємо зображення продукту
    try:
        response = requests.get(data["image"], timeout=5)
        response.raise_for_status()
        img_buffer = io.BytesIO(response.content)
        img_width, img_height = 100, 60
        x_pos = (pdf.w - img_width) / 2
        y_pos = pdf.get_y()
        pdf.image(img_buffer, x=x_pos, y=y_pos, w=img_width, h=img_height)
        pdf.rect(x_pos, y_pos, img_width, img_height)
        pdf.ln(img_height + 6)
    except Exception:
        pass

    page_width = pdf.w - 2 * pdf.l_margin
    label_width = 55

    def add_row(label, value):
        pdf.set_text_color(*CYAN)
        pdf.set_font("Helvetica", style="B", size=12)
        pdf.cell(label_width, 8, label, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.set_text_color(*WHITE)
        pdf.set_font("Helvetica", size=12)
        pdf.multi_cell(page_width - label_width, 8, str(value))
        pdf.ln(2)

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    add_row("Receipt Date:", now_str)
    add_row("Product:", data["title"])
    add_row("Amount Paid:", f"{data['price']} {data['currency']}")
    add_row("Buyer Wallet:", data["buyer_wallet"])
    add_row("Seller Wallet:", data["sellerWallet"])
    add_row("Transaction Hash:", data["tx_hash"])
    if data.get("commission"):
        add_row("Platform Commission:", f"{data['commission']} {data['currency']} (paid by seller)")

    pdf.ln(4)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(6)

    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", size=11)
    pdf.multi_cell(0, 7, "This document is provided for informational purposes only and serves as a record of a completed blockchain transaction. It does not constitute a legal agreement, contract, or proof of consent between the parties.")
    pdf.ln(3)
    pdf.set_font("Helvetica", style="I", size=10)
    pdf.multi_cell(0, 6, "User acknowledgements and consent selections are collected separately via the platform interface at the time of payment and may be stored in platform systems for audit or compliance purposes.")
    pdf.ln(4)
    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, 6, "Cryptocurrency transactions are irreversible and may involve technical or market risks. Users are responsible for reviewing all applicable platform documentation prior to initiating a transaction.")
    pdf.ln(8)
    pdf.set_text_color(*CYAN)
    pdf.set_font("Helvetica", style="I", size=9)
    pdf.cell(0, 6, "Powered by Neonflick-bps - Blockchain transaction record", align="C")

    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)

    # --- Відправка через Mailjet ---
    try:
        import base64
        pdf_base64 = base64.b64encode(pdf_buffer.read()).decode()

        data_mailjet = {
            "Messages": [
                {
                    "From": {"Email": MAILJET_FROM_EMAIL, "Name": MAILJET_FROM_NAME},
                    "To": [{"Email": data["email"]}],
                    "Subject": "Your Neonflick-bps E-Payment Receipt",
                    "TextPart": "Please find attached your electronic payment receipt.",
                    "Attachments": [
                        {
                            "ContentType": "application/pdf",
                            "Filename": "e-receipt.pdf",
                            "Base64Content": pdf_base64
                        }
                    ]
                }
            ]
        }

        result = mailjet.send.create(data=data_mailjet)
        if result.status_code != 200:
            print("Mailjet send failed:", result.status_code, result.json())
            return jsonify({"status": "error", "message": "Failed to send email"}), 500

        return jsonify({"status": "success", "message": "Receipt sent to email"}), 200

    except Exception as e:
        print("Mailjet send exception:", e)
        return jsonify({"status": "error", "message": "Failed to send email"}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
