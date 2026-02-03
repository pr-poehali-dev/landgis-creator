#!/usr/bin/env python3
"""Download PT Sans and save base64 to file"""

import urllib.request
import base64

url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Regular.ttf'

print(f"Downloading from: {url}")
response = urllib.request.urlopen(url)
font_data = response.read()
print(f"Downloaded {len(font_data)} bytes")

base64_string = base64.b64encode(font_data).decode('utf-8')
print(f"Converted to base64: {len(base64_string)} characters")

# Save to file
with open('pt-sans-base64.txt', 'w') as f:
    f.write(base64_string)

print("Saved to pt-sans-base64.txt")
print("\nFirst 100 characters:")
print(base64_string[:100])
