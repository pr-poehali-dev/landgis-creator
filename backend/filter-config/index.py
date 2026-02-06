import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для управления настройками фильтров (чтение/запись из БД)"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            raise Exception('DATABASE_URL not configured')
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            cursor.execute("""
                SELECT setting_value 
                FROM t_p78972315_landgis_creator.app_settings 
                WHERE setting_key = 'filter_columns_config'
                LIMIT 1
            """)
            result = cursor.fetchone()
            
            if result and result['setting_value']:
                config = json.loads(result['setting_value'])
            else:
                config = []
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'config': config}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            config = body.get('config', [])
            
            cursor.execute("""
                INSERT INTO t_p78972315_landgis_creator.app_settings (setting_key, setting_value, updated_at)
                VALUES ('filter_columns_config', %s, NOW())
                ON CONFLICT (setting_key) 
                DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
            """, (json.dumps(config),))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }