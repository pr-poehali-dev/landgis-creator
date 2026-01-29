"""API для управления пользователями"""
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
            user_id = params.get('id')
            if user_id:
                result = get_user(conn, int(user_id))
            else:
                result = get_all_users(conn)
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            result = create_user(conn, data)
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            result = update_user(conn, data)
        else:
            return error_response('Method not allowed', 405)
        
        conn.close()
        return result
    except Exception as e:
        return error_response(str(e), 500)

def get_all_users(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT u.*, c.name as company_name
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            ORDER BY u.full_name
        ''')
        users = cur.fetchall()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(u) for u in users], default=str),
            'isBase64Encoded': False
        }

def get_user(conn, user_id):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT u.*, c.name as company_name
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.id = %s
        ''', (user_id,))
        user = cur.fetchone()
        if not user:
            return error_response('User not found', 404)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(user), default=str),
            'isBase64Encoded': False
        }

def create_user(conn, data):
    required_fields = ['fullName', 'email', 'role']
    if not all(field in data for field in required_fields):
        return error_response(f'Missing required fields: {required_fields}', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO users 
            (company_id, full_name, email, phone, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        ''', (
            data.get('companyId'),
            data['fullName'],
            data['email'],
            data.get('phone'),
            data['role'],
            data.get('isActive', True)
        ))
        conn.commit()
        user = cur.fetchone()
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(user), default=str),
            'isBase64Encoded': False
        }

def update_user(conn, data):
    if 'id' not in data:
        return error_response('id is required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            UPDATE users SET
                company_id = COALESCE(%s, company_id),
                full_name = COALESCE(%s, full_name),
                email = COALESCE(%s, email),
                phone = COALESCE(%s, phone),
                role = COALESCE(%s, role),
                is_active = COALESCE(%s, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        ''', (
            data.get('companyId'),
            data.get('fullName'),
            data.get('email'),
            data.get('phone'),
            data.get('role'),
            data.get('isActive'),
            data['id']
        ))
        conn.commit()
        user = cur.fetchone()
        if not user:
            return error_response('User not found', 404)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(user), default=str),
            'isBase64Encoded': False
        }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
