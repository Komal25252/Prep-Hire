import requests
import base64
import io
from PIL import Image

img = Image.new('RGB', (100, 100), color='red')
buffered = io.BytesIO()
img.save(buffered, format="JPEG")
img_str = base64.b64encode(buffered.getvalue()).decode()

try:
    response = requests.post('http://localhost:5000/analyze-emotion', json={'frame': img_str})
    print("STATUS:", response.status_code)
    print("BODY:", response.text)
except Exception as e:
    print("Exception:", e)
