"""API для управления компаниями (CRUD операции для администратора)"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Проверка авторизации администратора
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    if not auth_header.startswith('Bearer '):
        return error_response('Требуется авторизация', 401)
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        # Проверка прав администратора
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"SELECT role FROM {schema}.companies WHERE id = %s AND is_active = true", (token,))
            user = cur.fetchone()
            
            if not user or user['role'] != 'admin':
                conn.close()
                return error_response('Доступ запрещен', 403)
        
        if method == 'GET':
            result = get_all_companies(conn, schema)
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            result = create_company(conn, schema, data)
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            result = update_company(conn, schema, data)
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {})
            result = delete_company(conn, schema, query_params.get('id'))
        else:
            result = error_response('Метод не поддерживается', 405)
        
        conn.close()
        return result
    except Exception as e:
        return error_response(str(e), 500)

def get_all_companies(conn, schema):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            SELECT id, name, login, role, inn, kpp, legal_address, 
                   contact_email, contact_phone, is_active, plain_password as password, 
                   created_at, updated_at
            FROM {schema}.companies 
            ORDER BY created_at DESC
        """)
        companies = cur.fetchall()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(c) for c in companies], default=str),
            'isBase64Encoded': False
        }

def create_company(conn, schema, data):
    name = data.get('name')
    login = data.get('login')
    password = data.get('password')
    role = data.get('role', 'user')
    
    if not all([name, login, password]):
        return error_response('Требуются поля: name, login, password', 400)
    
    # Хеширование пароля
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            INSERT INTO {schema}.companies (name, login, password_hash, plain_password, role, inn, kpp, 
                                            legal_address, contact_email, contact_phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, name, login, role, plain_password as password, created_at
        """, (
            name, login, password_hash, password, role,
            data.get('inn'), data.get('kpp'), data.get('legal_address'),
            data.get('contact_email'), data.get('contact_phone')
        ))
        new_company = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(new_company), default=str),
            'isBase64Encoded': False
        }

def update_company(conn, schema, data):
    company_id = data.get('id')
    
    if not company_id:
        return error_response('Требуется поле id', 400)
    
    # Проверка роли компании перед изменением статуса
    if 'is_active' in data:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"SELECT role FROM {schema}.companies WHERE id = %s", (company_id,))
            company = cur.fetchone()
            
            if company and company['role'] == 'admin':
                return error_response('Нельзя деактивировать аккаунт администратора', 403)
    
    # Формирование запроса на обновление
    updates = []
    params = []
    
    if 'name' in data:
        updates.append('name = %s')
        params.append(data['name'])
    if 'login' in data:
        updates.append('login = %s')
        params.append(data['login'])
    if 'password' in data:
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        updates.append('password_hash = %s')
        params.append(password_hash)
        updates.append('plain_password = %s')
        params.append(data['password'])
    if 'role' in data:
        updates.append('role = %s')
        params.append(data['role'])
    if 'inn' in data:
        updates.append('inn = %s')
        params.append(data['inn'])
    if 'kpp' in data:
        updates.append('kpp = %s')
        params.append(data['kpp'])
    if 'legal_address' in data:
        updates.append('legal_address = %s')
        params.append(data['legal_address'])
    if 'contact_email' in data:
        updates.append('contact_email = %s')
        params.append(data['contact_email'])
    if 'contact_phone' in data:
        updates.append('contact_phone = %s')
        params.append(data['contact_phone'])
    if 'is_active' in data:
        updates.append('is_active = %s')
        params.append(data['is_active'])
    
    if not updates:
        return error_response('Нет полей для обновления', 400)
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(company_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            UPDATE {schema}.companies 
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, name, login, role, plain_password as password, updated_at
        """, params)
        updated_company = cur.fetchone()
        conn.commit()
        
        if not updated_company:
            return error_response('Компания не найдена', 404)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(updated_company), default=str),
            'isBase64Encoded': False
        }

def delete_company(conn, schema, company_id):
    if not company_id:
        return error_response('Требуется параметр id', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            UPDATE {schema}.companies 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id
        """, (company_id,))
        result = cur.fetchone()
        conn.commit()
        
        if not result:
            return error_response('Компания не найдена', 404)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'id': result['id']}),
            'isBase64Encoded': False
        }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }