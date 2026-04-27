import requests
import json
import datetime

payload = {
    "sessionId": "test-session-123",
    "questionIndex": 0,
    "timestamp": datetime.datetime.now().isoformat(),
    "emotion": "happy",
    "scores": {
        "anger": 0,
        "disgust": 0,
        "fear": 0,
        "happy": 100,
        "neutral": 0,
        "sadness": 0,
        "surprise": 0
    }
}

try:
    response = requests.post('http://localhost:3000/api/interview/emotions', json=payload)
    print("STORE STATUS:", response.status_code)
    print("STORE BODY:", response.text)
except Exception as e:
    print("STORE ERROR:", e)

try:
    res = requests.get('http://localhost:3000/api/emotion/analyze?sessionId=test-session-123')
    print("ANALYZE STATUS:", res.status_code)
    print("ANALYZE BODY:", res.text)
except Exception as e:
    print("ANALYZE ERROR:", e)
