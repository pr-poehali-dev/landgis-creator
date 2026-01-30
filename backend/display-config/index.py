import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления настройками отображения атрибутов и элементов интерфейса'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            return handle_get(conn, event)
        elif method == 'POST':
            path = event.get('params', {}).get('path', '')
            if path == '/batch-order':
                return handle_batch_order(conn, event)
            return handle_create(conn, event)
        elif method == 'PUT':
            path = event.get('params', {}).get('path', '')
            if path == '/batch-order':
                return handle_batch_order(conn, event)
            return handle_update(conn, event)
        elif method == 'DELETE':
            return handle_delete(conn, event)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    finally:
        conn.close()

def handle_get(conn, event) -> dict:
    query_params = event.get('queryStringParameters', {}) or {}
    config_type = query_params.get('type')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if config_type:
            cur.execute('''
                SELECT id, config_type, config_key, display_name, display_order, 
                       visible_roles, enabled, settings, created_at, updated_at
                FROM t_p78972315_landgis_creator.display_config
                WHERE config_type = %s
                ORDER BY display_order, id
            ''', (config_type,))
        else:
            cur.execute('''
                SELECT id, config_type, config_key, display_name, display_order, 
                       visible_roles, enabled, settings, created_at, updated_at
                FROM t_p78972315_landgis_creator.display_config
                ORDER BY display_order, id
            ''')
        
        rows = cur.fetchall()
        
        configs = []
        for row in rows:
            configs.append({
                'id': row['id'],
                'configType': row['config_type'],
                'configKey': row['config_key'],
                'displayName': row['display_name'],
                'displayOrder': row['display_order'],
                'visibleRoles': row['visible_roles'],
                'enabled': row['enabled'],
                'settings': row['settings'] or {},
                'createdAt': row['created_at'].isoformat() if row['created_at'] else None,
                'updatedAt': row['updated_at'].isoformat() if row['updated_at'] else None
            })
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(configs)
    }

def handle_create(conn, event) -> dict:
    data = json.loads(event.get('body', '{}'))
    
    config_type = data.get('configType')
    config_key = data.get('configKey')
    display_name = data.get('displayName')
    display_order = data.get('displayOrder', 0)
    visible_roles = data.get('visibleRoles', ['admin'])
    enabled = data.get('enabled', True)
    settings = data.get('settings', {})
    
    if not all([config_type, config_key, display_name]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO t_p78972315_landgis_creator.display_config 
            (config_type, config_key, display_name, display_order, visible_roles, enabled, settings)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, config_type, config_key, display_name, display_order, 
                      visible_roles, enabled, settings, created_at, updated_at
        ''', (config_type, config_key, display_name, display_order, visible_roles, enabled, json.dumps(settings)))
        
        row = cur.fetchone()
        conn.commit()
        
        result = {
            'id': row['id'],
            'configType': row['config_type'],
            'configKey': row['config_key'],
            'displayName': row['display_name'],
            'displayOrder': row['display_order'],
            'visibleRoles': row['visibleRoles'],
            'enabled': row['enabled'],
            'settings': row['settings'] or {},
            'createdAt': row['created_at'].isoformat() if row['created_at'] else None,
            'updatedAt': row['updated_at'].isoformat() if row['updated_at'] else None
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result)
    }

def handle_update(conn, event) -> dict:
    path_params = event.get('params', {})
    config_id = path_params.get('id')
    
    if not config_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing config ID'})
        }
    
    data = json.loads(event.get('body', '{}'))
    
    update_fields = []
    params = []
    
    if 'displayName' in data:
        update_fields.append('display_name = %s')
        params.append(data['displayName'])
    
    if 'displayOrder' in data:
        update_fields.append('display_order = %s')
        params.append(data['displayOrder'])
    
    if 'visibleRoles' in data:
        update_fields.append('visible_roles = %s')
        params.append(data['visibleRoles'])
    
    if 'enabled' in data:
        update_fields.append('enabled = %s')
        params.append(data['enabled'])
    
    if 'settings' in data:
        update_fields.append('settings = %s')
        params.append(json.dumps(data['settings']))
    
    if not update_fields:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'})
        }
    
    update_fields.append('updated_at = CURRENT_TIMESTAMP')
    params.append(int(config_id))
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            UPDATE t_p78972315_landgis_creator.display_config 
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING id, config_type, config_key, display_name, display_order, 
                      visible_roles, enabled, settings, created_at, updated_at
        ''', params)
        
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Config not found'})
            }
        
        result = {
            'id': row['id'],
            'configType': row['config_type'],
            'configKey': row['config_key'],
            'displayName': row['display_name'],
            'displayOrder': row['display_order'],
            'visibleRoles': row['visible_roles'],
            'enabled': row['enabled'],
            'settings': row['settings'] or {},
            'createdAt': row['created_at'].isoformat() if row['created_at'] else None,
            'updatedAt': row['updated_at'].isoformat() if row['updated_at'] else None
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result)
    }

def handle_delete(conn, event) -> dict:
    path_params = event.get('params', {})
    config_id = path_params.get('id')
    
    if not config_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing config ID'})
        }
    
    with conn.cursor() as cur:
        cur.execute('''
            DELETE FROM t_p78972315_landgis_creator.display_config
            WHERE id = %s
        ''', (int(config_id),))
        
        conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True})
    }

def handle_batch_order(conn, event) -> dict:
    data = json.loads(event.get('body', '{}'))
    configs = data.get('configs', [])
    
    if not configs:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No configs provided'})
        }
    
    with conn.cursor() as cur:
        for config in configs:
            cur.execute('''
                UPDATE t_p78972315_landgis_creator.display_config
                SET display_order = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (config['displayOrder'], config['id']))
        
        conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True})
    }
