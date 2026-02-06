import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления атрибутами и их настройками'''
    
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {}) or {}
    
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
        return error_response('DATABASE_URL not configured', 500)
    
    try:
        conn = psycopg2.connect(dsn)
        
        # Handle attribute key renaming
        if query_params.get('action') == 'rename_key':
            if method == 'POST':
                body = json.loads(event.get('body', '{}'))
                return rename_attribute_key(conn, body)
            else:
                return error_response('Method not allowed', 405)
        
        # Handle adding new attribute to all objects
        if query_params.get('action') == 'add_attribute':
            if method == 'POST':
                body = json.loads(event.get('body', '{}'))
                return add_attribute_to_all(conn, body)
            else:
                return error_response('Method not allowed', 405)
        
        # Handle attribute config requests
        if query_params.get('type') == 'config':
            if method == 'GET':
                return get_attribute_configs(conn)
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                if 'updates' in body:
                    return batch_update_order(conn, body['updates'])
                else:
                    return update_single_config(conn, body)
            elif method == 'PUT':
                body = json.loads(event.get('body', '{}'))
                return update_single_config(conn, body)
            else:
                return error_response('Method not allowed', 405)
        
        # Handle property attribute updates (original functionality)
        if method != 'PUT':
            return error_response('Method not allowed', 405)
        
        property_id = query_params.get('id')
    
        if not property_id:
            return error_response('Missing property ID', 400)
        
        data = json.loads(event.get('body', '{}'))
        attributes = data.get('attributes', {})
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    UPDATE t_p78972315_landgis_creator.properties
                    SET attributes = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, attributes
                ''', (json.dumps(attributes), int(property_id)))
                
                row = cur.fetchone()
                conn.commit()
                
                if not row:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Property not found'}),
                        'isBase64Encoded': False
                    }
                
                result = {
                    'id': row['id'],
                    'attributes': row['attributes']
                }
                
                return success_response(result)
        finally:
            conn.close()
            
    except Exception as e:
        return error_response(str(e), 500)

def get_attribute_configs(conn):
    '''Получить настройки отображения атрибутов'''
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT 
                id, 
                attribute_key as "attributeKey", 
                display_name as "displayName",
                display_order as "displayOrder", 
                visible_in_table as "visibleInTable",
                visible_roles as "visibleRoles", 
                created_at as "createdAt", 
                updated_at as "updatedAt"
            FROM t_p78972315_landgis_creator.attribute_config
            ORDER BY display_order, id
        ''')
        configs = cur.fetchall()
    return success_response(configs)

def update_single_config(conn, data):
    '''Обновить настройки одного атрибута'''
    config_id = data.get('id')
    if not config_id:
        return error_response('id is required', 400)
    
    updates = []
    params = []
    
    if 'displayOrder' in data:
        updates.append('display_order = %s')
        params.append(data['displayOrder'])
    if 'visibleInTable' in data:
        updates.append('visible_in_table = %s')
        params.append(data['visibleInTable'])
    if 'displayName' in data:
        updates.append('display_name = %s')
        params.append(data['displayName'])
    
    if not updates:
        return error_response('No fields to update', 400)
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(config_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        query = f'''
            UPDATE t_p78972315_landgis_creator.attribute_config
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, attribute_key as "attributeKey", display_name as "displayName",
                      display_order as "displayOrder", visible_in_table as "visibleInTable"
        '''
        cur.execute(query, params)
        config = cur.fetchone()
        conn.commit()
    
    if not config:
        return error_response('Config not found', 404)
    
    return success_response(config)

def batch_update_order(conn, updates):
    '''Массовое обновление порядка отображения'''
    with conn.cursor() as cur:
        for update in updates:
            config_id = update.get('id')
            display_order = update.get('displayOrder')
            
            if config_id is None or display_order is None:
                continue
            
            cur.execute('''
                UPDATE t_p78972315_landgis_creator.attribute_config
                SET display_order = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (display_order, config_id))
        
        conn.commit()
    
    return success_response({'message': 'Order updated successfully'})

def success_response(data, status_code=200):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, default=str),
        'isBase64Encoded': False
    }

def rename_attribute_key(conn, data):
    '''Переименование ключа атрибута во всех объектах'''
    old_key = data.get('oldKey')
    new_key = data.get('newKey')
    
    if not old_key or not new_key:
        return error_response('oldKey and newKey are required', 400)
    
    if old_key == new_key:
        return error_response('Keys must be different', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            UPDATE t_p78972315_landgis_creator.properties
            SET attributes = attributes - %s || jsonb_build_object(%s, attributes->%s),
                updated_at = CURRENT_TIMESTAMP
            WHERE attributes ? %s
        ''', (old_key, new_key, old_key, old_key))
        
        affected_rows = cur.rowcount
        conn.commit()
    
    return success_response({
        'success': True,
        'message': f'Renamed {old_key} to {new_key}',
        'affectedRows': affected_rows
    })

def add_attribute_to_all(conn, data):
    '''Добавление нового атрибута во все объекты с дефолтным значением'''
    attr_key = data.get('key')
    format_type = data.get('formatType', 'text')
    
    if not attr_key:
        return error_response('key is required', 400)
    
    # Определяем дефолтное значение по типу
    default_value = ''
    if format_type in ['toggle', 'boolean']:
        default_value = False
    elif format_type in ['number', 'money']:
        default_value = 0
    elif format_type == 'multiselect':
        default_value = []
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Добавляем ключ во все объекты, где его ещё нет
        cur.execute('''
            UPDATE t_p78972315_landgis_creator.properties
            SET attributes = attributes || jsonb_build_object(%s, %s),
                updated_at = CURRENT_TIMESTAMP
            WHERE NOT (attributes ? %s)
        ''', (attr_key, json.dumps(default_value), attr_key))
        
        affected_rows = cur.rowcount
        conn.commit()
    
    return success_response({
        'success': True,
        'message': f'Added attribute {attr_key} to all objects',
        'affectedRows': affected_rows
    })

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