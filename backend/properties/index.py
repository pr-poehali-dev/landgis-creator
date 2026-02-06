import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления объектами недвижимости'''
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
        
        # Check if this is a config request
        path = event.get('path', '')
        if '/config' in path or event.get('queryStringParameters', {}).get('type') == 'config':
            if method == 'GET':
                return get_attribute_configs(conn)
            elif method == 'PUT':
                body = json.loads(event.get('body', '{}'))
                return update_attribute_config(conn, body)
            else:
                return error_response('Method not allowed', 405)
        
        if method == 'GET':
            return get_properties(conn)
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_property(conn, body)
        elif method == 'DELETE':
            property_id = event.get('queryStringParameters', {}).get('id')
            if not property_id:
                return error_response('Property ID required', 400)
            return delete_property(conn, int(property_id))
        else:
            return error_response('Method not allowed', 405)
            
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
    finally:
        if 'conn' in locals():
            conn.close()

def get_properties(conn):
    '''Получить все объекты недвижимости'''
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT 
                id, title, type, price, area, location,
                latitude, longitude, segment, status, boundary, attributes,
                created_at, updated_at
            FROM properties
            ORDER BY created_at DESC
        ''')
        properties = cur.fetchall()
        
        result = []
        for prop in properties:
            # Очистка attributes от двойных JSON строк
            attrs = prop['attributes'] if prop['attributes'] else {}
            if isinstance(attrs, dict):
                cleaned_attrs = {}
                for k, v in attrs.items():
                    # Если значение это строка с двойными кавычками, заменить на пустую строку
                    if isinstance(v, str) and v in ('""', '"\\"\\""', '\\"\\""'):
                        cleaned_attrs[k] = ''
                    else:
                        cleaned_attrs[k] = v
                attrs = cleaned_attrs
            
            result.append({
                'id': prop['id'],
                'title': prop['title'],
                'type': prop['type'],
                'price': float(prop['price']),
                'area': float(prop['area']),
                'location': prop['location'],
                'coordinates': [float(prop['latitude']), float(prop['longitude'])],
                'segment': prop['segment'],
                'status': prop['status'],
                'boundary': prop['boundary'] if prop['boundary'] else None,
                'attributes': attrs,
                'created_at': prop['created_at'].isoformat() if prop['created_at'] else None,
                'updated_at': prop['updated_at'].isoformat() if prop['updated_at'] else None
            })
        
        return success_response(result)

def create_property(conn, data):
    '''Создать новый объект недвижимости'''
    required_fields = ['title', 'type', 'price', 'area', 'location', 'coordinates', 'segment', 'status']
    for field in required_fields:
        if field not in data:
            return error_response(f'Missing required field: {field}', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        boundary_json = json.dumps(data.get('boundary')) if data.get('boundary') else None
        attributes_json = json.dumps(data.get('attributes', {}))
        
        print(f"Creating property: {data.get('title')}")
        print(f"Attributes count: {len(data.get('attributes', {}))}")
        print(f"Attributes: {attributes_json[:200]}...")
        
        cur.execute('''
            INSERT INTO properties 
            (title, type, price, area, location, latitude, longitude, segment, status, boundary, attributes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
            RETURNING id, title, type, price, area, location, latitude, longitude, 
                      segment, status, boundary, attributes, created_at, updated_at
        ''', (
            data['title'],
            data['type'],
            data['price'],
            data['area'],
            data['location'],
            data['coordinates'][0],
            data['coordinates'][1],
            data['segment'],
            data['status'],
            boundary_json,
            attributes_json
        ))
        
        conn.commit()
        prop = cur.fetchone()
        
        result = {
            'id': prop['id'],
            'title': prop['title'],
            'type': prop['type'],
            'price': float(prop['price']),
            'area': float(prop['area']),
            'location': prop['location'],
            'coordinates': [float(prop['latitude']), float(prop['longitude'])],
            'segment': prop['segment'],
            'status': prop['status'],
            'boundary': prop['boundary'] if prop['boundary'] else None,
            'attributes': prop['attributes'] if prop['attributes'] else {},
            'created_at': prop['created_at'].isoformat() if prop['created_at'] else None,
            'updated_at': prop['updated_at'].isoformat() if prop['updated_at'] else None
        }
        
        return success_response(result, 201)

def delete_property(conn, property_id):
    '''Удалить объект недвижимости'''
    with conn.cursor() as cur:
        cur.execute('DELETE FROM properties WHERE id = %s', (property_id,))
        conn.commit()
        
        if cur.rowcount == 0:
            return error_response('Property not found', 404)
        
        return success_response({'message': 'Property deleted successfully'})

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

def get_attribute_configs(conn):
    '''Получить настройки отображения атрибутов'''
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
    
    return success_response(configs)

def update_attribute_config(conn, data):
    '''Обновить настройки атрибута'''
    attribute_key = data.get('attributeKey')
    if not attribute_key:
        return error_response('attributeKey is required', 400)
    
    updates = []
    params = []
    
    if 'displayName' in data:
        updates.append('display_name = %s')
        params.append(data['displayName'])
    if 'displayOrder' in data:
        updates.append('display_order = %s')
        params.append(data['displayOrder'])
    if 'visibleInTable' in data:
        updates.append('visible_in_table = %s')
        params.append(data['visibleInTable'])
    if 'visibleRoles' in data:
        updates.append('visible_roles = %s')
        params.append(data['visibleRoles'])
    
    if not updates:
        return error_response('No fields to update', 400)
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(attribute_key)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        query = f'''
            UPDATE t_p78972315_landgis_creator.attribute_config
            SET {', '.join(updates)}
            WHERE attribute_key = %s
            RETURNING id, attribute_key as "attributeKey", display_name as "displayName",
                      display_order as "displayOrder", visible_in_table as "visibleInTable",
                      visible_roles as "visibleRoles"
        '''
        cur.execute(query, params)
        config = cur.fetchone()
        conn.commit()
    
    if not config:
        return error_response('Config not found', 404)
    
    return success_response(config)