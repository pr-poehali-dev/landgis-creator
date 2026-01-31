"""API для управления настройками карты"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {}) or {}
    resource = query_params.get('resource', 'settings')

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
        
        if resource == 'display-configs':
            if method == 'GET':
                result = get_display_configs(conn)
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                result = save_display_configs(conn, data)
            else:
                return error_response('Method not allowed', 405)
        else:
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

def get_display_configs(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT id, config_type, config_key, display_name, display_order,
                   visible_roles, enabled, settings, format_type, format_options
            FROM display_configs
            ORDER BY display_order
        ''')
        configs = cur.fetchall()
        
        result = []
        for row in configs:
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

def save_display_configs(conn, data):
    configs = data.get('configs', [])
    if not configs:
        return error_response('configs array required', 400)
    
    with conn.cursor() as cur:
        cur.execute('DELETE FROM display_configs')
        
        for cfg in configs:
            cur.execute('''
                INSERT INTO display_configs
                (id, config_type, config_key, display_name, display_order,
                 visible_roles, enabled, settings, format_type, format_options)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                cfg.get('id'),
                cfg.get('configType', 'attribute'),
                cfg.get('configKey'),
                cfg.get('displayName'),
                cfg.get('displayOrder', 0),
                cfg.get('visibleRoles', ['admin']),
                cfg.get('enabled', True),
                json.dumps(cfg.get('settings', {})),
                cfg.get('formatType'),
                json.dumps(cfg.get('formatOptions')) if cfg.get('formatOptions') else None
            ))
        
        conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'count': len(configs)}),
        'isBase64Encoded': False
    }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }