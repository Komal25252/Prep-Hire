from emotiefflib import EmotiEffLib
import numpy as np

try:
    model = EmotiEffLib(model_name='enet_b0_8_best_vgaf')
    print("Model loaded successfully")
    # Test with a dummy image
    dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
    res = model.predict(dummy_img)
    print("Prediction result:", res)
except Exception as e:
    print("Error:", e)
