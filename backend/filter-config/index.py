"""API для хранения и получения конфигурации фильтров и правил видимости"""
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

    params = event.get('queryStringParameters') or {}
    config_type = params.get('type', 'filters')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    if method == 'GET':
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT config FROM filter_config WHERE config_type = %s ORDER BY id LIMIT 1",
                (config_type,)
            )
            row = cur.fetchone()

        conn.close()

        if config_type == 'filter_visibility':
            data = row['config'] if row else {'rules': [], 'updatedAt': ''}
            if isinstance(data, str):
                data = json.loads(data)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(data),
                'isBase64Encoded': False
            }

        config = row['config'] if row else []
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'config': config}),
            'isBase64Encoded': False
        }

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))

        with conn.cursor() as cur:
            if config_type == 'filter_visibility':
                data = json.dumps(body)
                cur.execute(
                    "UPDATE filter_config SET config = %s, updated_at = CURRENT_TIMESTAMP WHERE config_type = %s",
                    (data, config_type)
                )
                if cur.rowcount == 0:
                    cur.execute(
                        "INSERT INTO filter_config (config, config_type) VALUES (%s, %s)",
                        (data, config_type)
                    )
            else:
                config = body.get('config', [])
                cur.execute(
                    "UPDATE filter_config SET config = %s, updated_at = CURRENT_TIMESTAMP WHERE config_type = %s",
                    (json.dumps(config), config_type)
                )
                if cur.rowcount == 0:
                    cur.execute(
                        "INSERT INTO filter_config (config, config_type) VALUES (%s, %s)",
                        (json.dumps(config), config_type)
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
