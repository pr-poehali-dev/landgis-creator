import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления конфигурацией атрибутов'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return error_response('DATABASE_URL not configured', 500)
        
        conn = psycopg2.connect(dsn)
        
        if method == 'GET':
            return get_config(conn)
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_or_update_config(conn, body)
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            return update_config(conn, body)
        elif method == 'DELETE':
            attribute_key = event.get('queryStringParameters', {}).get('key')
            if not attribute_key:
                return error_response('Attribute key required', 400)
            return delete_config(conn, attribute_key)
        else:
            return error_response('Method not allowed', 405)
            
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
    finally:
        if 'conn' in locals():
            conn.close()

def get_config(conn):
    '''Получить конфигурацию всех атрибутов'''
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT 
                id, attribute_key, display_name, display_order,
                visible_in_table, visible_roles, created_at, updated_at
            FROM attribute_config
            ORDER BY display_order ASC, attribute_key ASC
        ''')
        configs = cur.fetchall()
        
        result = []
        for config in configs:
            result.append({
                'id': config['id'],
                'attributeKey': config['attribute_key'],
                'displayName': config['display_name'],
                'displayOrder': config['display_order'],
                'visibleInTable': config['visible_in_table'],
                'visibleRoles': config['visible_roles'],
                'createdAt': config['created_at'].isoformat() if config['created_at'] else None,
                'updatedAt': config['updated_at'].isoformat() if config['updated_at'] else None
            })
        
        return success_response(result)

def create_or_update_config(conn, data):
    '''Создать или обновить конфигурацию атрибута'''
    if 'attributeKey' not in data or 'displayName' not in data:
        return error_response('attributeKey and displayName are required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO attribute_config 
            (attribute_key, display_name, display_order, visible_in_table, visible_roles)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (attribute_key) 
            DO UPDATE SET
                display_name = EXCLUDED.display_name,
                display_order = EXCLUDED.display_order,
                visible_in_table = EXCLUDED.visible_in_table,
                visible_roles = EXCLUDED.visible_roles,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id, attribute_key, display_name, display_order, 
                      visible_in_table, visible_roles, created_at, updated_at
        ''', (
            data['attributeKey'],
            data['displayName'],
            data.get('displayOrder', 0),
            data.get('visibleInTable', False),
            data.get('visibleRoles', ['admin'])
        ))
        
        conn.commit()
        config = cur.fetchone()
        
        result = {
            'id': config['id'],
            'attributeKey': config['attribute_key'],
            'displayName': config['display_name'],
            'displayOrder': config['display_order'],
            'visibleInTable': config['visible_in_table'],
            'visibleRoles': config['visible_roles'],
            'createdAt': config['created_at'].isoformat() if config['created_at'] else None,
            'updatedAt': config['updated_at'].isoformat() if config['updated_at'] else None
        }
        
        return success_response(result, 201)

def update_config(conn, data):
    '''Обновить конфигурацию атрибута'''
    if 'attributeKey' not in data:
        return error_response('attributeKey is required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        updates = []
        values = []
        
        if 'displayName' in data:
            updates.append('display_name = %s')
            values.append(data['displayName'])
        if 'displayOrder' in data:
            updates.append('display_order = %s')
            values.append(data['displayOrder'])
        if 'visibleInTable' in data:
            updates.append('visible_in_table = %s')
            values.append(data['visibleInTable'])
        if 'visibleRoles' in data:
            updates.append('visible_roles = %s')
            values.append(data['visibleRoles'])
        
        if not updates:
            return error_response('No fields to update', 400)
        
        updates.append('updated_at = CURRENT_TIMESTAMP')
        values.append(data['attributeKey'])
        
        query = f'''
            UPDATE attribute_config 
            SET {', '.join(updates)}
            WHERE attribute_key = %s
            RETURNING id, attribute_key, display_name, display_order,
                      visible_in_table, visible_roles, created_at, updated_at
        '''
        
        cur.execute(query, values)
        conn.commit()
        
        config = cur.fetchone()
        if not config:
            return error_response('Attribute config not found', 404)
        
        result = {
            'id': config['id'],
            'attributeKey': config['attribute_key'],
            'displayName': config['display_name'],
            'displayOrder': config['display_order'],
            'visibleInTable': config['visible_in_table'],
            'visibleRoles': config['visible_roles'],
            'createdAt': config['created_at'].isoformat() if config['created_at'] else None,
            'updatedAt': config['updated_at'].isoformat() if config['updated_at'] else None
        }
        
        return success_response(result)

def delete_config(conn, attribute_key):
    '''Удалить конфигурацию атрибута'''
    with conn.cursor() as cur:
        cur.execute('DELETE FROM attribute_config WHERE attribute_key = %s', (attribute_key,))
        conn.commit()
        
        if cur.rowcount == 0:
            return error_response('Attribute config not found', 404)
        
        return success_response({'message': 'Attribute config deleted successfully'})

def success_response(data, status_code=200):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data),
        'isBase64Encoded': False
    }

def error_response(message, status_code=400):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
