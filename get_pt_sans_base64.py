#!/usr/bin/env python3
"""
Download PT Sans Regular TTF font with Cyrillic support and convert to base64.
This script downloads the font from Google Fonts repository and outputs the base64 string.
"""

import urllib.request
import base64
import sys

def main():
    # Direct URL to PT Sans Regular from Google Fonts repository
    url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Regular.ttf'
    
    print("Downloading PT Sans Regular font from Google Fonts...", file=sys.stderr)
    print(f"URL: {url}", file=sys.stderr)
    
    try:
        # Download the font file
        response = urllib.request.urlopen(url)
        font_data = response.read()
        
        print(f"Downloaded {len(font_data)} bytes", file=sys.stderr)
        
        # Convert to base64
        base64_string = base64.b64encode(font_data).decode('utf-8')
        
        print(f"Converted to base64 ({len(base64_string)} characters)", file=sys.stderr)
        print("", file=sys.stderr)
        print("Base64 string below (copy this for jsPDF):", file=sys.stderr)
        print("=" * 80, file=sys.stderr)
        
        # Output the base64 string to stdout
        print(base64_string)
        
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
