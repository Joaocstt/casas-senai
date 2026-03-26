import base64
import re
import os
import sys

html_path = '/home/mariacecilia/Downloads/projeto-casasvvv2(1)/senai.html'
output_dir = '/home/mariacecilia/Downloads/projeto-casasvvv2(1)/projeto-casas/arcanum/frontend/public/videos'
output_path = os.path.join(output_dir, 'hero-bg.mp4')

print(f"--- Starting video extraction ---", flush=True)
print(f"HTML Path: {html_path}", flush=True)
print(f"Output Dir: {output_dir}", flush=True)

if not os.path.exists(html_path):
    print(f"ERROR: HTML file not found at {html_path}", flush=True)
    sys.exit(1)

if not os.path.exists(output_dir):
    print(f"Creating output directory...", flush=True)
    os.makedirs(output_dir, exist_ok=True)

try:
    print(f"Reading HTML file (8.7MB)...", flush=True)
    with open(html_path, 'r', encoding='utf-8') as f:
        # Read the file in chunks to find the base64 string
        content = f.read()
    
    print("Searching for base64 video string...", flush=True)
    # The video is in a <source src="data:video/mp4;base64,..."> tag
    match = re.search(r'base64,([^"]+)', content)
    if match:
        encoded_video = match.group(1)
        print(f"Found base64 string. Length: {len(encoded_video)}", flush=True)
        
        print("Decoding base64...", flush=True)
        video_data = base64.b64decode(encoded_video)
        print(f"Decoded data size: {len(video_data)} bytes", flush=True)
        
        print(f"Saving to {output_path}...", flush=True)
        with open(output_path, 'wb') as f:
            f.write(video_data)
        
        if os.path.exists(output_path):
            print(f"SUCCESS: Video saved! Size: {os.path.getsize(output_path)} bytes", flush=True)
        else:
            print(f"ERROR: File was not saved for some reason.", flush=True)
    else:
        print("ERROR: Could not find base64 video string in HTML.", flush=True)
except Exception as e:
    print(f"EXCEPTION: {str(e)}", flush=True)
    sys.exit(1)

print("--- Extraction complete ---", flush=True)
