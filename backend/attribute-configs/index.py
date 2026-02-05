import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event, context):
    '''API для управления глобальными настройками атрибутов'''
    
    method = event.get('httpMethod', 'GET')
    
    # CORS preflight
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
    
    # Подключение к БД
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # GET - получить все настройки
        if method == 'GET':
            cur.execute('''
                SELECT config_key, config_data, display_order 
                FROM attribute_configs 
                ORDER BY display_order
            ''')
            rows = cur.fetchall()
            
            # Преобразуем в формат {config_key: config_data}
            configs = {}
            for row in rows:
                config_data = row['config_data']
                config_data['displayOrder'] = row['display_order']
                configs[row['config_key']] = config_data
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(configs),
                'isBase64Encoded': False
            }
        
        # POST - сохранить все настройки (полная замена)
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            configs = body.get('configs', {})
            
            # Удаляем старые настройки
            cur.execute('DELETE FROM attribute_configs')
            
            # Вставляем новые
            for config_key, config_data in configs.items():
                display_order = config_data.get('displayOrder', 0)
                
                # Убираем displayOrder из config_data перед сохранением
                config_copy = {k: v for k, v in config_data.items() if k != 'displayOrder'}
                
                cur.execute('''
                    INSERT INTO attribute_configs (config_key, config_data, display_order)
                    VALUES (%s, %s, %s)
                ''', (config_key, json.dumps(config_copy), display_order))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Configs saved', 'count': len(configs)}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()
