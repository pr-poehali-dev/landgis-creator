import json

def handler(event, context):
    '''Настройки атрибутов'''
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps([]),
        'isBase64Encoded': False
    }
