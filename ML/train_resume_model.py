"""
Train resume classifier from extracted_resume_data.csv and save pkl files
to resume-class-ml/ directory.
"""
import os, re, json
import pandas as pd
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

BASE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE, 'resume-class-ml', 'extracted_resume_data.csv')
OUT_DIR = os.path.join(BASE, 'resume-class-ml')

def clean(text):
    text = str(text)
    text = re.sub(r'http\S+\s*', ' ', text)
    text = re.sub(r'RT|cc', ' ', text)
    text = re.sub(r'#\S+', '', text)
    text = re.sub(r'@\S+', '  ', text)
    text = re.sub(r'[%s]' % re.escape(r"""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', text)
    text = re.sub(r'[^\x00-\x7f]', r' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()

print("Reading CSV...")
df = pd.read_csv(CSV_PATH)
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(f"Sample:\n{df.head(2)}")

# Auto-detect text and label columns
text_col = next((c for c in df.columns if 'resume' in c.lower() or 'text' in c.lower()), df.columns[0])
label_col = next((c for c in df.columns if 'category' in c.lower() or 'label' in c.lower() or 'class' in c.lower()), df.columns[-1])

print(f"\nUsing text_col='{text_col}', label_col='{label_col}'")
print(f"Unique labels: {df[label_col].nunique()}")
print(f"Label counts:\n{df[label_col].value_counts().head(10)}")

df['cleaned'] = df[text_col].apply(clean)

le = LabelEncoder()
y = le.fit_transform(df[label_col])

tfidf = TfidfVectorizer(sublinear_tf=True, stop_words='english', max_features=3000)
X = tfidf.fit_transform(df['cleaned'])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("\nTraining RandomForest...")
model = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
model.fit(X_train, y_train)

acc = accuracy_score(y_test, model.predict(X_test))
print(f"Accuracy: {acc:.2%}")

# Save
joblib.dump(model, os.path.join(OUT_DIR, 'resume_classifier_model.pkl'))
joblib.dump(tfidf, os.path.join(OUT_DIR, 'tfidf_vectorizer.pkl'))
joblib.dump(le, os.path.join(OUT_DIR, 'label_encoder.pkl'))

print(f"\nSaved to {OUT_DIR}")
print(f"Labels: {list(le.classes_)}")

# Quick test
sample = clean("python machine learning scikit-learn tensorflow data science pandas numpy")
vec = tfidf.transform([sample])
pred = model.predict(vec)
label = le.inverse_transform(pred)[0]
conf = float(np.max(model.predict_proba(vec)) * 100)
result = {"domain": label, "confidence": round(conf, 1)}
print(f"\nTest prediction: {json.dumps(result)}")
