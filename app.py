from pymongo.mongo_client import MongoClient
from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

db_password = os.getenv("DB_PASSWORD")

uri = f"mongodb+srv://neonflick-bps:{db_password}@cluster0.mhunksj.mongodb.net/?appName=Cluster0"

client = MongoClient(uri)
db = client.get_database("neonflick-bps")
users = db.get_collection("users")

@app.route("/")
def root():
    return jsonify({
        "name": "Neonflick-bps",
        "status": "backend running"
    })

if __name__ == "__main__":
    app.run(debug=True)
