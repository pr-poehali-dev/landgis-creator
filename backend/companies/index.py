"""API для управления компаниями"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

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

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        
        if method == 'GET':
            company_id = params.get('id')
            if company_id:
                result = get_company(conn, int(company_id))
            else:
                result = get_all_companies(conn)
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            result = create_company(conn, data)
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            result = update_company(conn, data)
        else:
            return error_response('Method not allowed', 405)
        
        conn.close()
        return result
    except Exception as e:
        return error_response(str(e), 500)

def get_all_companies(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT * FROM companies ORDER BY name')
        companies = cur.fetchall()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(c) for c in companies], default=str),
            'isBase64Encoded': False
        }

def get_company(conn, company_id):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT * FROM companies WHERE id = %s', (company_id,))
        company = cur.fetchone()
        if not company:
            return error_response('Company not found', 404)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(company), default=str),
            'isBase64Encoded': False
        }

def create_company(conn, data):
    required_fields = ['name']
    if not all(field in data for field in required_fields):
        return error_response(f'Missing required fields: {required_fields}', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO companies 
            (name, inn, kpp, legal_address, contact_email, contact_phone, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        ''', (
            data['name'],
            data.get('inn'),
            data.get('kpp'),
            data.get('legalAddress'),
            data.get('contactEmail'),
            data.get('contactPhone'),
            data.get('isActive', True)
        ))
        conn.commit()
        company = cur.fetchone()
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(company), default=str),
            'isBase64Encoded': False
        }

def update_company(conn, data):
    if 'id' not in data:
        return error_response('id is required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            UPDATE companies SET
                name = COALESCE(%s, name),
                inn = COALESCE(%s, inn),
                kpp = COALESCE(%s, kpp),
                legal_address = COALESCE(%s, legal_address),
                contact_email = COALESCE(%s, contact_email),
                contact_phone = COALESCE(%s, contact_phone),
                is_active = COALESCE(%s, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        ''', (
            data.get('name'),
            data.get('inn'),
            data.get('kpp'),
            data.get('legalAddress'),
            data.get('contactEmail'),
            data.get('contactPhone'),
            data.get('isActive'),
            data['id']
        ))
        conn.commit()
        company = cur.fetchone()
        if not company:
            return error_response('Company not found', 404)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(company), default=str),
            'isBase64Encoded': False
        }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
