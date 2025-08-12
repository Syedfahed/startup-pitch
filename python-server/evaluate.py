import base64
import os
from flask import Flask, request, jsonify
from index import evaluate_pitch  # Import your evaluation function

app = Flask(__name__)

@app.route("/evaluate", methods=["POST"])
def evaluate():
    try:
        data = request.get_json()
        audio_data = data.get("audioData")
        result = evaluate_pitch(audio_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Allow React frontend to connect
    from flask_cors import CORS
    CORS(app)
    app.run(host="0.0.0.0", port=5000, debug=True)
