import joblib, io, re, sys, os
import numpy as np

# Test each pkl in resume-class-ml
base = os.path.join(os.path.dirname(__file__), 'resume-class-ml')

def clean(text):
    text = re.sub(r'http\S+\s*', ' ', text)
    text = re.sub(r'RT|cc', ' ', text)
    text = re.sub(r'#\S+', '', text)
    text = re.sub(r'@\S+', '  ', text)
    text = re.sub(r'[%s]' % re.escape(r"""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', text)
    text = re.sub(r'[^\x00-\x7f]', r' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()

sample = clean("Python developer with 5 years experience in machine learning, scikit-learn, pandas, numpy, tensorflow")

for model_name in ['resume_classifier.pkl', 'resume_classifier_model.pkl']:
    try:
        clf = joblib.load(os.path.join(base, model_name))
        vec = joblib.load(os.path.join(base, 'tfidf_vectorizer.pkl'))
        enc = joblib.load(os.path.join(base, 'label_encoder.pkl'))
        X = vec.transform([sample])
        pred = clf.predict(X)
        label = enc.inverse_transform(pred)[0]
        proba = np.max(clf.predict_proba(X)) * 100
        print(f"[{model_name}] => domain={label}, confidence={proba:.1f}%")
        print(f"   labels: {list(enc.classes_)}")
    except Exception as e:
        print(f"[{model_name}] => ERROR: {e}")
