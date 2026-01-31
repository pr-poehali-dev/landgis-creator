import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления настройками отображения атрибутов'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': '', 'isBase64Encoded': False}
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'DATABASE_URL not configured'}), 'isBase64Encoded': False}
    
    conn = psycopg2.connect(dsn)
    try:
        if method == 'GET':
            return handle_get(conn)
        elif method == 'POST':
            return handle_post(conn, event)
        elif method == 'PUT':
            return handle_put(conn, event)
        elif method == 'DELETE':
            return handle_delete(conn, event)
        else:
            return {'statusCode': 405, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}
    finally:
        conn.close()


def handle_get(conn) -> dict:
    '''Получить все настройки'''
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


def handle_post(conn, event: dict) -> dict:
    '''Создать новый конфиг'''
    data = json.loads(event.get('body', '{}'))
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO display_configs (config_type, config_key, display_name, display_order, visible_roles, enabled, settings, format_type, format_options)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, config_type, config_key, display_name, display_order, visible_roles, enabled, settings, format_type, format_options
        ''', (
            data.get('configType', 'attribute'),
            data.get('configKey'),
            data.get('displayName'),
            data.get('displayOrder', 0),
            data.get('visibleRoles', ['admin']),
            data.get('enabled', True),
            json.dumps(data.get('settings', {})),
            data.get('formatType'),
            json.dumps(data.get('formatOptions')) if data.get('formatOptions') else None
        ))
        row = cur.fetchone()
        conn.commit()
        
        result = {'id': row['id'], 'configType': row['config_type'], 'configKey': row['config_key'], 'displayName': row['display_name'], 'displayOrder': row['display_order'], 'visibleRoles': list(row['visible_roles']), 'enabled': row['enabled'], 'settings': row['settings'] or {}, 'formatType': row['format_type'], 'formatOptions': row['format_options']}
        
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(result), 'isBase64Encoded': False}


def handle_put(conn, event: dict) -> dict:
    '''Обновить конфиг'''
    data = json.loads(event.get('body', '{}'))
    config_id = data.get('id')
    
    if not config_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'id is required'}), 'isBase64Encoded': False}
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            UPDATE display_configs SET config_key=%s, display_name=%s, display_order=%s, visible_roles=%s, enabled=%s, settings=%s, format_type=%s, format_options=%s, updated_at=NOW()
            WHERE id=%s RETURNING id, config_type, config_key, display_name, display_order, visible_roles, enabled, settings, format_type, format_options
        ''', (data.get('configKey'), data.get('displayName'), data.get('displayOrder'), data.get('visibleRoles'), data.get('enabled'), json.dumps(data.get('settings', {})), data.get('formatType'), json.dumps(data.get('formatOptions')) if data.get('formatOptions') else None, config_id))
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'}), 'isBase64Encoded': False}
        
        result = {'id': row['id'], 'configType': row['config_type'], 'configKey': row['config_key'], 'displayName': row['display_name'], 'displayOrder': row['display_order'], 'visibleRoles': list(row['visible_roles']), 'enabled': row['enabled'], 'settings': row['settings'] or {}, 'formatType': row['format_type'], 'formatOptions': row['format_options']}
        
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(result), 'isBase64Encoded': False}


def handle_delete(conn, event: dict) -> dict:
    '''Удалить конфиг'''
    params = event.get('queryStringParameters', {}) or {}
    config_id = params.get('id')
    
    if not config_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'id required'}), 'isBase64Encoded': False}
    
    with conn.cursor() as cur:
        cur.execute('DELETE FROM display_configs WHERE id=%s', (config_id,))
        conn.commit()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}
