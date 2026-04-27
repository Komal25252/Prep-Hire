import unittest
import json
import base64
import io
from PIL import Image
import numpy as np
from app import app
from unittest.mock import MagicMock, patch

class TestFlaskEmotionAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_analyze_emotion_missing_frame(self):
        response = self.app.post('/analyze-emotion', 
                                 data=json.dumps({}),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertIn('frame field is missing', data['error'])

    def test_analyze_emotion_invalid_base64(self):
        response = self.app.post('/analyze-emotion', 
                                 data=json.dumps({'frame': 'invalid-base64'}),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 500) # base64.b64decode might not fail, but Image.open will

    @patch('app.emotion_model')
    def test_analyze_emotion_success(self, mock_model):
        # Mock model response
        # emotions, raw_scores
        mock_model.predict_emotions.return_value = (
            ['Fear'], 
            np.array([[0.1, 0.05, 0.1, 0.4, 0.1, 0.1, 0.1, 0.05]])
        )
        
        # Create a dummy JPEG image
        img = Image.new('RGB', (100, 100), color='red')
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        response = self.app.post('/analyze-emotion', 
                                 data=json.dumps({'frame': img_str}),
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['emotion'], 'fear')
        self.assertEqual(len(data['scores']), 7)
        self.assertIn('fear', data['scores'])
        self.assertNotIn('contempt', data['scores'])
        self.assertEqual(data['scores']['fear'], 40.0)

    @patch('app.emotion_model')
    def test_analyze_emotion_exception(self, mock_model):
        mock_model.predict_emotions.side_effect = Exception("Model error")
        
        img = Image.new('RGB', (100, 100), color='red')
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        response = self.app.post('/analyze-emotion', 
                                 data=json.dumps({'frame': img_str}),
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.data)
        self.assertEqual(data['error'], "Model error")

if __name__ == '__main__':
    unittest.main()
