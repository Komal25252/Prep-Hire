# from flask import Flask, request, jsonify
# import joblib

# app = Flask(__name__)

# classifier = joblib.load("resume_classifier_model.pkl")
# vectorizer = joblib.load("tfidf_vectorizer.pkl")
# encoder = joblib.load("label_encoder.pkl")


# def predict_resume_domain(raw_text):
#     vec = vectorizer.transform([raw_text])
#     pred = classifier.predict(vec)
#     domain_name = encoder.inverse_transform(pred)[0]
#     return domain_name


# @app.route("/predict", methods=["POST"])
# def predict():
#     text = request.json["text"]
#     result = predict_resume_domain(text)
#     return jsonify({"domain": result})


# if __name__ == "__main__":
#     app.run(port=5000)

from flask import Flask, request, jsonify
import joblib
import re
import io
import PyPDF2 # You'll need to run: pip3 install PyPDF2
from flask_cors import CORS # You'll need to run: pip3 install flask-cors
import base64
from PIL import Image
import numpy as np
from deepface import DeepFace
import os

app = Flask(__name__)
CORS(app) # This allows your React/Next.js frontend to talk to this API

# 1. Load Models from resume-class-ml directory
_ML_DIR = os.path.dirname(os.path.abspath(__file__))
_MODEL_DIR = os.path.join(_ML_DIR, 'resume-class-ml')
classifier = joblib.load(os.path.join(_MODEL_DIR, "resume_classifier_model.pkl"))
vectorizer = joblib.load(os.path.join(_MODEL_DIR, "tfidf_vectorizer.pkl"))
encoder = joblib.load(os.path.join(_MODEL_DIR, "label_encoder.pkl"))

# note: DeepFace loads its own models automatically on first use.
# No need to pre-load here.

# 2. Cleaning function (Must match your training logic!)
def clean_resume(text):
    text = re.sub(r'http\S+\s*', ' ', text)
    text = re.sub(r'RT|cc', ' ', text)
    text = re.sub(r'#\S+', '', text)
    text = re.sub(r'@\S+', '  ', text)
    text = re.sub(r'[%s]' % re.escape(r"""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', text)
    text = re.sub(r'[^\x00-\x7f]', r' ', text) 
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()

@app.route("/predict", methods=["POST"])
def predict():
    # Check if a file was uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    # 3. Extract Text from PDF
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        raw_text = ""
        for page in pdf_reader.pages:
            raw_text += page.extract_text()
        
        # 4. Process and Predict
        cleaned_text = clean_resume(raw_text)
        vec = vectorizer.transform([cleaned_text])
        pred = classifier.predict(vec)
        domain_name = encoder.inverse_transform(pred)[0]

        # Confidence score
        import numpy as np
        probs = classifier.predict_proba(vec)
        confidence = float(np.max(probs) * 100)
        
        return jsonify({
            "domain": domain_name,
            "confidence": round(confidence, 1),
            "resumeText": raw_text[:3000].strip(),
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-emotion", methods=["POST"])
def analyze_emotion():
    data = request.get_json()
    if not data or 'frame' not in data:
        return jsonify({"error": "frame field is missing"}), 400
    
    try:
        # decode base64 JPEG
        frame_str = data['frame']
        if "," in frame_str:
            frame_str = frame_str.split(",")[1]
        
        img_bytes = base64.b64decode(frame_str)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        # predict using DeepFace
        # enforce_detection=False prevents crashing if no face is found
        results = DeepFace.analyze(np.array(img), actions=['emotion'], enforce_detection=False)
        
        if not results:
            return jsonify({"error": "No results from analysis"}), 500
            
        # extract data for the primary face
        face_data = results[0]
        
        # DeepFace labels: ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        raw_scores = face_data['emotion'] # values are already 0-100 in DeepFace
        
        # Mapping to match your frontend expectations
        # deepface 'angry' -> 'anger'
        # deepface 'sad' -> 'sadness'
        mapping = {
            'angry': 'anger',
            'disgust': 'disgust',
            'fear': 'fear',
            'happy': 'happy',
            'neutral': 'neutral',
            'sad': 'sadness',
            'surprise': 'surprise'
        }
        
        final_scores = {mapping[k]: float(v) for k, v in raw_scores.items() if k in mapping}
        
        # dominant emotion
        dominant = face_data['dominant_emotion']
        # Apply the same mapping to dominant emotion
        predicted_emotion = mapping.get(dominant, dominant)
        
        return jsonify({
            "emotion": predicted_emotion,
            "scores": final_scores
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)