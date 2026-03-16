"""API для хранения и получения конфигурации фильтров"""
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
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    if method == 'GET':
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT config FROM filter_config ORDER BY id LIMIT 1')
            row = cur.fetchone()
            config = row['config'] if row else []
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'config': config}),
            'isBase64Encoded': False
        }

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        config = body.get('config', [])
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE filter_config SET config = %s, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM filter_config ORDER BY id LIMIT 1)',
                (json.dumps(config),)
            )
            if cur.rowcount == 0:
                cur.execute(
                    'INSERT INTO filter_config (config) VALUES (%s)',
                    (json.dumps(config),)
                )
            conn.commit()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }

    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
