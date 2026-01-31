import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''Получение настроек отображения атрибутов'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': '', 'isBase64Encoded': False}
    
    if method != 'GET':
        return {'statusCode': 405, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'DATABASE_URL not configured'}), 'isBase64Encoded': False}
    
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT id, config_type, config_key, display_name, display_order, visible_roles, enabled, settings, format_type, format_options FROM display_configs ORDER BY display_order')
            rows = cur.fetchall()
            
            configs = []
            for row in rows:
                configs.append({
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
            
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(configs), 'isBase64Encoded': False}
    except Exception as e:
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': str(e)}), 'isBase64Encoded': False}
    finally:
        conn.close()
