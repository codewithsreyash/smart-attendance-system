from flask import Flask, request, jsonify
from flask_cors import CORS
from face_utils.encoder import encode_face  # Import function from encoder.py
import face_recognition  # Ensure this is installed

app = Flask(__name__)
CORS(app)  # Allow frontend to send requests

# Mock database - Replace with actual database storage
KNOWN_FACES = {
    "John Doe": [0.12, 0.34, 0.56, ...],  # Replace with actual face encodings
    "Jane Smith": [0.23, 0.45, 0.67, ...]
}

@app.route('/encode', methods=['POST'])
def encode_face_route():
    """Encodes a face from an uploaded image and returns the encoding."""
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']
    encoding = encode_face(file)

    if encoding:
        return jsonify({"encoding": encoding})
    return jsonify({"error": "No face detected"}), 400

@app.route('/verify', methods=['POST'])
def verify_face():
    """Compares the uploaded face with stored face encodings."""
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']
    img = face_recognition.load_image_file(file)
    encodings = face_recognition.face_encodings(img)

    if len(encodings) == 0:
        return jsonify({"error": "No face detected"}), 400

    encoding = encodings[0]

    for name, known_encoding in KNOWN_FACES.items():
        match = face_recognition.compare_faces([known_encoding], encoding)
        if match[0]:  # If face matches
            return jsonify({"message": "Face Authentication Successful", "name": name})

    return jsonify({"error": "Face not recognized"}), 401

if __name__ == '__main__':
    app.run(port=5001)
