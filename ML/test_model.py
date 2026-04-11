# Loading the models into your backend server
import joblib

# These are the files you pushed to GitHub
classifier = joblib.load('resume_classifier_model.pkl')
vectorizer = joblib.load('tfidf_vectorizer.pkl')
encoder = joblib.load('label_encoder.pkl')

def predict_resume_domain(raw_text):
    # 1. Clean the text (use the function we wrote)
    cleaned = clean_resume(raw_text)
    
    # 2. Vectorize (Math transformation)
    vec = vectorizer.transform([cleaned])
    
    # 3. Predict & Decode
    pred = classifier.predict(vec)
    domain_name = encoder.inverse_transform(pred)[0]
    
    return domain_name
    