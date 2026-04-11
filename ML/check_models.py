import joblib
import os

# .pkl files are in the same folder as this script
folder = os.path.dirname(os.path.abspath(__file__))

def check_my_models():
    try:
        classifier = joblib.load(os.path.join(folder, 'resume_classifier_model.pkl'))
        vectorizer = joblib.load(os.path.join(folder, 'tfidf_vectorizer.pkl'))
        encoder = joblib.load(os.path.join(folder, 'label_encoder.pkl'))

        print("✅ SUCCESS: All 3 models loaded correctly!")

        print("\n--- Domains your model knows ---")
        print(encoder.classes_)

        test_skill = "React and Node.js developer"
        vec = vectorizer.transform([test_skill])
        pred = classifier.predict(vec)
        domain = encoder.inverse_transform(pred)[0]

        print(f"\n--- Quick Test ---")
        print(f"Input: '{test_skill}'")
        print(f"Predicted Domain: {domain}")

    except Exception as e:
        print(f"❌ ERROR: Could not load models. {e}")

if __name__ == "__main__":
    check_my_models()
