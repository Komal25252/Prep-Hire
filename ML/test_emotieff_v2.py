from emotiefflib.facial_analysis import EmotiEffLibRecognizer
import numpy as np

try:
    model = EmotiEffLibRecognizer(engine='onnx', model_name='enet_b0_8_best_vgaf')
    print("Model loaded successfully")
    # Test with a dummy image
    dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
    res = model.predict_emotions(dummy_img, logits=False)
    print("Prediction result:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
