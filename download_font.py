#!/usr/bin/env python3
import urllib.request
import base64
import sys

urls = [
    'https://github.com/google/fonts/raw/main/ofl/ptsans/PT_Sans-Web-Regular.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Regular.ttf',
    'https://github.com/paratype/pt-sans/raw/master/fonts/PT_Sans-Web-Regular.ttf',
]

for url in urls:
    try:
        print(f"Trying: {url}", file=sys.stderr)
        response = urllib.request.urlopen(url)
        font_data = response.read()
        base64_string = base64.b64encode(font_data).decode('utf-8')
        print(f"Success! Downloaded {len(font_data)} bytes", file=sys.stderr)
        print(base64_string)
        sys.exit(0)
    except Exception as e:
        print(f"Failed: {e}", file=sys.stderr)
        continue

print("All download attempts failed", file=sys.stderr)
sys.exit(1)