import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления настройками атрибутов объектов'''
    
    method = event.get('httpMethod', 'GET')
    path = event.get('requestContext', {}).get('http', {}).get('path', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return error_response('DATABASE_URL not configured', 500)
    
    try:
        conn = psycopg2.connect(dsn)
        conn.set_session(autocommit=True)
        
        if method == 'GET':
            return get_configs(conn)
        elif method == 'POST':
            if '/rename' in path:
                return rename_attribute_key(conn, event)
            return create_or_update_config(conn, event)
        elif method == 'PUT':
            return update_config(conn, event)
        elif method == 'DELETE':
            return delete_config(conn, event)
        else:
            return error_response('Method not allowed', 405)
            
    except Exception as e:
        return error_response(str(e), 500)
    finally:
        if conn:
            conn.close()

def get_configs(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT id, attribute_key as "attributeKey", display_name as "displayName",
                   display_order as "displayOrder", visible_in_table as "visibleInTable",
                   visible_roles as "visibleRoles", created_at as "createdAt", 
                   updated_at as "updatedAt"
            FROM t_p78972315_landgis_creator.attribute_config
            ORDER BY display_order, id
        ''')
        configs = cur.fetchall()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(configs, default=str),
        'isBase64Encoded': False
    }

def create_or_update_config(conn, event):
    body = json.loads(event.get('body', '{}'))
    
    attribute_key = body.get('attributeKey')
    display_name = body.get('displayName')
    display_order = body.get('displayOrder', 0)
    visible_in_table = body.get('visibleInTable', False)
    visible_roles = body.get('visibleRoles', ['admin'])
    
    if not attribute_key or not display_name:
        return error_response('attributeKey and displayName are required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO t_p78972315_landgis_creator.attribute_config 
            (attribute_key, display_name, display_order, visible_in_table, visible_roles)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (attribute_key) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                display_order = EXCLUDED.display_order,
                visible_in_table = EXCLUDED.visible_in_table,
                visible_roles = EXCLUDED.visible_roles,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id, attribute_key as "attributeKey", display_name as "displayName",
                      display_order as "displayOrder", visible_in_table as "visibleInTable",
                      visible_roles as "visibleRoles"
        ''', (attribute_key, display_name, display_order, visible_in_table, visible_roles))
        
        config = cur.fetchone()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(config, default=str),
        'isBase64Encoded': False
    }

def update_config(conn, event):
    body = json.loads(event.get('body', '{}'))
    attribute_key = body.get('attributeKey')
    
    if not attribute_key:
        return error_response('attributeKey is required', 400)
    
    updates = []
    params = []
    
    if 'displayName' in body:
        updates.append('display_name = %s')
        params.append(body['displayName'])
    if 'displayOrder' in body:
        updates.append('display_order = %s')
        params.append(body['displayOrder'])
    if 'visibleInTable' in body:
        updates.append('visible_in_table = %s')
        params.append(body['visibleInTable'])
    if 'visibleRoles' in body:
        updates.append('visible_roles = %s')
        params.append(body['visibleRoles'])
    
    if not updates:
        return error_response('No fields to update', 400)
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(attribute_key)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            UPDATE t_p78972315_landgis_creator.attribute_config
            SET {', '.join(updates)}
            WHERE attribute_key = %s
            RETURNING id, attribute_key as "attributeKey", display_name as "displayName",
                      display_order as "displayOrder", visible_in_table as "visibleInTable",
                      visible_roles as "visibleRoles"
        ''', params)
        
        config = cur.fetchone()
    
    if not config:
        return error_response('Config not found', 404)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(config, default=str),
        'isBase64Encoded': False
    }

def delete_config(conn, event):
    params = event.get('queryStringParameters') or {}
    attribute_key = params.get('key')
    
    if not attribute_key:
        return error_response('key parameter is required', 400)
    
    with conn.cursor() as cur:
        cur.execute('''
            DELETE FROM t_p78972315_landgis_creator.attribute_config
            WHERE attribute_key = %s
        ''', (attribute_key,))
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Config deleted'}),
        'isBase64Encoded': False
    }

def rename_attribute_key(conn, event):
    '''Переименовывает ключ атрибута во всех объектах БД и в конфигурации'''
    
    body = json.loads(event.get('body', '{}'))
    old_key = body.get('oldKey')
    new_key = body.get('newKey')
    
    if not old_key or not new_key:
        return error_response('oldKey and newKey are required', 400)
    
    if old_key == new_key:
        return error_response('Keys are the same', 400)
    
    with conn.cursor() as cur:
        cur.execute('''
            UPDATE t_p78972315_landgis_creator.properties
            SET attributes = attributes - %s || jsonb_build_object(%s, attributes->%s)
            WHERE attributes ? %s
        ''', (old_key, new_key, old_key, old_key))
        
        affected_properties = cur.rowcount
        
        cur.execute('''
            UPDATE t_p78972315_landgis_creator.attribute_config
            SET attribute_key = %s, updated_at = CURRENT_TIMESTAMP
            WHERE attribute_key = %s
        ''', (new_key, old_key))
        
        affected_configs = cur.rowcount
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Attribute key renamed successfully',
            'affectedProperties': affected_properties,
            'affectedConfigs': affected_configs
        }),
        'isBase64Encoded': False
    }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
