import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для настроек отображения атрибутов'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        
        if method == 'GET':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    SELECT id, config_type, config_key, display_name, display_order,
                           visible_roles, enabled, settings, format_type, format_options
                    FROM display_configs
                    ORDER BY display_order
                ''')
                configs = cur.fetchall()
                
                result = []
                for row in configs:
                    result.append({
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
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            configs = data.get('configs', [])
            
            if not configs:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'configs required'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute('DELETE FROM display_configs')
                
                for cfg in configs:
                    cur.execute('''
                        INSERT INTO display_configs
                        (id, config_type, config_key, display_name, display_order,
                         visible_roles, enabled, settings, format_type, format_options)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ''', (
                        cfg.get('id'),
                        cfg.get('configType', 'attribute'),
                        cfg.get('configKey'),
                        cfg.get('displayName'),
                        cfg.get('displayOrder', 0),
                        cfg.get('visibleRoles', ['admin']),
                        cfg.get('enabled', True),
                        json.dumps(cfg.get('settings', {})),
                        cfg.get('formatType'),
                        json.dumps(cfg.get('formatOptions')) if cfg.get('formatOptions') else None
                    ))
                
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        if conn:
            conn.close()
