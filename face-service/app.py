from flask import Flask, request, jsonify
from flask_cors import CORS
from face_utils.encoder import encode_face
import face_recognition
import numpy as np
import os

app = Flask(__name__)
# Configure CORS to allow requests from frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Directory to store known face encodings
KNOWN_FACES_DIR = os.path.join(os.path.dirname(__file__), 'known_faces')
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

def load_known_faces():
    """Load known face encodings from files."""
    known_faces = {}
    for filename in os.listdir(KNOWN_FACES_DIR):
        if filename.endswith('.npy'):
            name = os.path.splitext(filename)[0]
            encoding_path = os.path.join(KNOWN_FACES_DIR, filename)
            known_faces[name] = np.load(encoding_path)
    return known_faces

KNOWN_FACES = load_known_faces()

@app.route('/encode', methods=['POST'])
def encode_face_route():
    """Encodes a face from an uploaded image and returns the encoding."""
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    try:
        file = request.files['image']
        # Load the image using face_recognition
        img = face_recognition.load_image_file(file)
        # Find face locations in the image
        face_locations = face_recognition.face_locations(img)
        
        if not face_locations:
            return jsonify({"error": "No face detected in the image"}), 400
            
        # Get face encodings
        face_encodings = face_recognition.face_encodings(img, face_locations)
        
        if not face_encodings:
            return jsonify({"error": "Could not encode face features"}), 400
            
        encoding = face_encodings[0]
        
        # Compare with known faces
        for name, known_encoding in KNOWN_FACES.items():
            # Compare faces with a tolerance of 0.6 (lower is more strict)
            matches = face_recognition.compare_faces([known_encoding], encoding, tolerance=0.6)
            if matches[0]:
                return jsonify({
                    "success": True,
                    "message": f"Welcome back, {name}!",
                    "name": name
                })
        
        # If no match found but we have a valid encoding
        return jsonify({
            "success": False,
            "message": "Face not recognized. Please register first.",
            "encoding": encoding.tolist()
        })

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500

@app.route('/register', methods=['POST'])
def register_face():
    """Register a new face."""
    if 'image' not in request.files or 'name' not in request.form:
        return jsonify({"error": "Image and name are required"}), 400

    try:
        file = request.files['image']
        name = request.form['name']
        
        # Load and encode face
        img = face_recognition.load_image_file(file)
        face_locations = face_recognition.face_locations(img)
        
        if not face_locations:
            return jsonify({"error": "No face detected in the image"}), 400
            
        face_encodings = face_recognition.face_encodings(img, face_locations)
        
        if not face_encodings:
            return jsonify({"error": "Could not encode face features"}), 400
            
        encoding = face_encodings[0]
        
        # Save encoding
        encoding_path = os.path.join(KNOWN_FACES_DIR, f"{name}.npy")
        np.save(encoding_path, encoding)
        KNOWN_FACES[name] = encoding
        
        return jsonify({
            "success": True,
            "message": f"Successfully registered {name}"
        })

    except Exception as e:
        print(f"Error registering face: {str(e)}")
        return jsonify({"error": f"Error registering face: {str(e)}"}), 500

if __name__ == '__main__':
    # Ensure the application is accessible from other devices
    app.run(host='0.0.0.0', port=5001, debug=True)
