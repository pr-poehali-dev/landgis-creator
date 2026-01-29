"""API для управления настройками карты"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
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

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        
        if method == 'GET':
            result = get_all_settings(conn)
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            result = upsert_setting(conn, data)
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            result = upsert_setting(conn, data)
        else:
            return error_response('Method not allowed', 405)
        
        conn.close()
        return result
    except Exception as e:
        return error_response(str(e), 500)

def get_all_settings(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT * FROM map_settings ORDER BY setting_key')
        settings = cur.fetchall()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(s) for s in settings], default=str),
            'isBase64Encoded': False
        }

def upsert_setting(conn, data):
    if 'settingKey' not in data or 'settingValue' not in data:
        return error_response('settingKey and settingValue are required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO map_settings (setting_key, setting_value, description)
            VALUES (%s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                description = EXCLUDED.description,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        ''', (data['settingKey'], data['settingValue'], data.get('description', '')))
        conn.commit()
        setting = cur.fetchone()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(setting), default=str),
            'isBase64Encoded': False
        }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
