import base64
import re
import os

html_path = '/home/mariacecilia/Downloads/projeto-casasvvv2(1)/senai.html'
output_dir = '/home/mariacecilia/Downloads/projeto-casasvvv2(1)/projeto-casas/arcanum/frontend/public/videos'
output_path = os.path.join(output_dir, 'hero-bg.mp4')

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Reading {html_path}...")
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Searching for base64 video...")
match = re.search(r'base64,([^"]+)', content)
if match:
    encoded_video = match.group(1)
    print(f"Found video base64 (length: {len(encoded_video)}). Decoding...")
    video_data = base64.b64decode(encoded_video)
    
    with open(output_path, 'wb') as f:
        f.write(video_data)
    print(f"Video saved to {output_path}")
else:
    print("Video base64 not found!")
