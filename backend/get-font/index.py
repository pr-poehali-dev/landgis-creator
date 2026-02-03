import urllib.request
import base64

def handler(event, context):
    """Download PT Sans Regular font and return as base64"""
    
    url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Regular.ttf'
    
    try:
        response = urllib.request.urlopen(url)
        font_data = response.read()
        base64_string = base64.b64encode(font_data).decode('utf-8')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            },
            'body': base64_string,
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            },
            'body': f'Error: {str(e)}',
            'isBase64Encoded': False
        }