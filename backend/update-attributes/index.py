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
        
        # Handle deleting attribute from all objects
        if query_params.get('action') == 'delete_attribute':
            if method == 'POST':
                body = json.loads(event.get('body', '{}'))
                return delete_attribute_from_all(conn, body)
            else:
                return error_response('Method not allowed', 405)
        
        # Handle syncing attribute configs to DB
        if query_params.get('action') == 'sync_configs':
            if method == 'POST':
                body = json.loads(event.get('body', '{}'))
                return sync_attribute_configs(conn, body)
            else:
                return error_response('Method not allowed', 405)
        
        # Handle edit permissions requests
        if query_params.get('type') == 'edit_permissions':
            if method == 'GET':
                return get_edit_permissions(conn)
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                return save_edit_permissions(conn, body)
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
        
        print(f'📝 Updating property {property_id}')
        print(f'📝 Received attributes: {json.dumps(attributes, ensure_ascii=False)[:500]}')
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    UPDATE t_p78972315_landgis_creator.landplots
                    SET attributes = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, attributes
                ''', (json.dumps(attributes), int(property_id)))
                
                row = cur.fetchone()
                conn.commit()
                
                if not row:
                    print(f'❌ Property {property_id} not found')
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
                
                print(f'✅ Property {property_id} updated successfully')
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
                format_type as "formatType",
                format_options as "formatOptions",
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
            UPDATE t_p78972315_landgis_creator.landplots
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
            UPDATE t_p78972315_landgis_creator.landplots
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

def delete_attribute_from_all(conn, data):
    '''Удаление атрибута из всех объектов'''
    key = data.get('key')
    
    if not key:
        return error_response('key is required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            UPDATE t_p78972315_landgis_creator.landplots
            SET attributes = attributes - %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE attributes ? %s
        ''', (key, key))
        
        affected_rows = cur.rowcount
        conn.commit()
    
    return success_response({
        'success': True,
        'message': f'Deleted attribute {key}',
        'affectedRows': affected_rows
    })

def sync_attribute_configs(conn, data):
    '''Синхронизация настроек атрибутов из localStorage в БД'''
    configs = data.get('configs', [])
    
    if not configs:
        return error_response('configs array is required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        for config in configs:
            attribute_key = config.get('configKey') or config.get('attributeKey')
            if not attribute_key:
                continue
            
            # Проверяем существование записи
            cur.execute('''
                SELECT id FROM t_p78972315_landgis_creator.attribute_config
                WHERE attribute_key = %s
            ''', (attribute_key,))
            
            existing = cur.fetchone()
            
            format_type = config.get('formatType', 'text')
            format_options = json.dumps(config.get('formatOptions')) if config.get('formatOptions') else None
            display_name = config.get('displayName', attribute_key)
            display_order = config.get('displayOrder', 0)
            visible_in_table = config.get('enabled', False)
            visible_roles = config.get('visibleRoles', ['admin'])
            
            if existing:
                # Обновляем существующую запись
                cur.execute('''
                    UPDATE t_p78972315_landgis_creator.attribute_config
                    SET display_name = %s,
                        display_order = %s,
                        visible_in_table = %s,
                        visible_roles = %s,
                        format_type = %s,
                        format_options = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE attribute_key = %s
                ''', (display_name, display_order, visible_in_table, visible_roles, format_type, format_options, attribute_key))
            else:
                # Создаём новую запись
                cur.execute('''
                    INSERT INTO t_p78972315_landgis_creator.attribute_config
                    (attribute_key, display_name, display_order, visible_in_table, visible_roles, format_type, format_options)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''', (attribute_key, display_name, display_order, visible_in_table, visible_roles, format_type, format_options))
        
        conn.commit()
    
    return success_response({
        'success': True,
        'message': f'Synced {len(configs)} attribute configs to database'
    })

def get_edit_permissions(conn):
    '''Получить права редактирования участков'''
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT allowed_roles as "allowedRoles"
            FROM t_p78972315_landgis_creator.edit_permissions
            ORDER BY id DESC
            LIMIT 1
        ''')
        result = cur.fetchone()
    
    if result:
        return success_response(result)
    else:
        return success_response({'allowedRoles': ['admin']})

def save_edit_permissions(conn, data):
    '''Сохранить права редактирования участков'''
    allowed_roles = data.get('allowedRoles', ['admin'])
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Удаляем все старые записи
        cur.execute('DELETE FROM t_p78972315_landgis_creator.edit_permissions')
        
        # Вставляем новую
        cur.execute('''
            INSERT INTO t_p78972315_landgis_creator.edit_permissions (allowed_roles)
            VALUES (%s)
            RETURNING allowed_roles as "allowedRoles"
        ''', (allowed_roles,))
        
        result = cur.fetchone()
        conn.commit()
    
    return success_response(result)

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