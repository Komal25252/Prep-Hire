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

app = Flask(__name__)
CORS(app) # This allows your React/Next.js frontend to talk to this API

# 1. Load Models
classifier = joblib.load("resume_classifier_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")
encoder = joblib.load("label_encoder.pkl")

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
        
        return jsonify({
            "domain": domain_name,
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)