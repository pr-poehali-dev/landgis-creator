"""API для управления настройками фильтров"""
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
            result = get_all_filters(conn)
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            result = upsert_filter(conn, data)
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            result = upsert_filter(conn, data)
        else:
            return error_response('Method not allowed', 405)
        
        conn.close()
        return result
    except Exception as e:
        return error_response(str(e), 500)

def get_all_filters(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT * FROM filter_settings ORDER BY display_order, filter_key')
        filters = cur.fetchall()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(f) for f in filters], default=str),
            'isBase64Encoded': False
        }

def upsert_filter(conn, data):
    required_fields = ['filterKey', 'filterLabel', 'filterType']
    if not all(field in data for field in required_fields):
        return error_response(f'Missing required fields: {required_fields}', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO filter_settings 
            (filter_key, filter_label, filter_type, options, is_enabled, display_order)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (filter_key) 
            DO UPDATE SET
                filter_label = EXCLUDED.filter_label,
                filter_type = EXCLUDED.filter_type,
                options = EXCLUDED.options,
                is_enabled = EXCLUDED.is_enabled,
                display_order = EXCLUDED.display_order,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        ''', (
            data['filterKey'],
            data['filterLabel'],
            data['filterType'],
            json.dumps(data.get('options', {})),
            data.get('isEnabled', True),
            data.get('displayOrder', 0)
        ))
        conn.commit()
        filter_setting = cur.fetchone()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(filter_setting), default=str),
            'isBase64Encoded': False
        }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
