"""API для управления стилями полигонов на карте"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            attribute_key = event.get('queryStringParameters', {}).get('attribute_key', 'segment')
            
            cursor.execute("""
                SELECT attribute_key, attribute_value, fill_color, fill_opacity, 
                       stroke_color, stroke_width
                FROM t_p78972315_landgis_creator.polygon_style_config
                WHERE attribute_key = %s
                ORDER BY attribute_value
            """, (attribute_key,))
            
            styles = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(s) for s in styles], default=str)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            active_attribute = body.get('active_attribute', 'segment')
            styles = body.get('styles', [])
            
            cursor.execute("""
                UPDATE t_p78972315_landgis_creator.polygon_style_settings
                SET active_attribute = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            """, (active_attribute,))
            
            for style in styles:
                cursor.execute("""
                    INSERT INTO t_p78972315_landgis_creator.polygon_style_config
                        (attribute_key, attribute_value, fill_color, fill_opacity, stroke_color, stroke_width)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (attribute_key, attribute_value) 
                    DO UPDATE SET
                        fill_color = EXCLUDED.fill_color,
                        fill_opacity = EXCLUDED.fill_opacity,
                        stroke_color = EXCLUDED.stroke_color,
                        stroke_width = EXCLUDED.stroke_width,
                        updated_at = CURRENT_TIMESTAMP
                """, (
                    style['attribute_key'],
                    style['attribute_value'],
                    style['fill_color'],
                    style['fill_opacity'],
                    style['stroke_color'],
                    style['stroke_width']
                ))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
