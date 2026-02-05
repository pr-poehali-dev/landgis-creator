"""
API для управления глобальными настройками приложения
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """Управление настройками приложения (логотип, заголовок и т.д.)"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }

    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if method == 'GET':
        # Получить все настройки
        cur.execute("SELECT setting_key, setting_value FROM app_settings")
        rows = cur.fetchall()
        
        settings = {}
        for row in rows:
            try:
                settings[row['setting_key']] = json.loads(row['setting_value'])
            except:
                settings[row['setting_key']] = row['setting_value']
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(settings),
            'isBase64Encoded': False
        }

    elif method == 'PUT':
        # Обновить настройки
        body = json.loads(event.get('body', '{}'))
        
        for key, value in body.items():
            value_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
            
            cur.execute("""
                INSERT INTO app_settings (setting_key, setting_value, updated_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (setting_key) 
                DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP
            """, (key, value_str))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }

    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
