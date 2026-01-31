"""API для управления настройками фильтров"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {}) or {}
    mode = query_params.get('mode', 'filters')

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
        
        if mode == 'attrs':
            if method == 'GET':
                result = get_attrs(conn)
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                result = save_attrs(conn, data)
            else:
                return error_response('Method not allowed', 405)
        else:
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

def get_attrs(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT id, config_type, config_key, display_name, display_order,
                   visible_roles, enabled, settings, format_type, format_options
            FROM display_configs ORDER BY display_order
        ''')
        rows = cur.fetchall()
        result = []
        for row in rows:
            result.append({
                'id': row['id'],
                'configType': row['config_type'],
                'configKey': row['config_key'],
                'displayName': row['display_name'],
                'displayOrder': row['display_order'],
                'visibleRoles': list(row['visible_roles']),
                'enabled': row['enabled'],
                'settings': row['settings'] or {},
                'formatType': row['format_type'],
                'formatOptions': row['format_options']
            })
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }

def save_attrs(conn, data):
    configs = data.get('configs', [])
    if not configs:
        return error_response('configs required', 400)
    with conn.cursor() as cur:
        cur.execute('DELETE FROM display_configs')
        for cfg in configs:
            cur.execute('''
                INSERT INTO display_configs (id, config_type, config_key, display_name, display_order, visible_roles, enabled, settings, format_type, format_options)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (cfg.get('id'), cfg.get('configType', 'attribute'), cfg.get('configKey'), cfg.get('displayName'), cfg.get('displayOrder', 0), cfg.get('visibleRoles', ['admin']), cfg.get('enabled', True), json.dumps(cfg.get('settings', {})), cfg.get('formatType'), json.dumps(cfg.get('formatOptions')) if cfg.get('formatOptions') else None))
        conn.commit()
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }