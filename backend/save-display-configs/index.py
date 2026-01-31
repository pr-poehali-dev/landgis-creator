import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''Сохранение всех настроек отображения атрибутов'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': '', 'isBase64Encoded': False}
    
    if method != 'POST':
        return {'statusCode': 405, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'DATABASE_URL not configured'}), 'isBase64Encoded': False}
    
    data = json.loads(event.get('body', '{}'))
    configs = data.get('configs', [])
    
    if not configs:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'configs array required'}), 'isBase64Encoded': False}
    
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            # Удаляем все старые настройки
            cur.execute('DELETE FROM display_configs')
            
            # Вставляем новые
            for cfg in configs:
                cur.execute('''
                    INSERT INTO display_configs (id, config_type, config_key, display_name, display_order, visible_roles, enabled, settings, format_type, format_options)
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
        
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'count': len(configs)}), 'isBase64Encoded': False}
    except Exception as e:
        conn.rollback()
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': str(e)}), 'isBase64Encoded': False}
    finally:
        conn.close()
