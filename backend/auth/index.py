"""API для авторизации пользователей (логин и проверка токена)"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        # POST ?action=login - авторизация
        if method == 'POST' and action == 'login':
            data = json.loads(event.get('body', '{}'))
            result = login(conn, schema, data)
        # GET ?action=me - проверка токена и получение данных пользователя
        elif method == 'GET' and action == 'me':
            auth_header = event.get('headers', {}).get('X-Authorization', '')
            result = get_current_user(conn, schema, auth_header)
        else:
            result = error_response('Метод не поддерживается', 405)
        
        conn.close()
        return result
    except Exception as e:
        return error_response(str(e), 500)

def login(conn, schema, data):
    login_str = data.get('login')
    password = data.get('password')
    
    if not all([login_str, password]):
        return error_response('Требуются поля: login, password', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            SELECT id, name, login, password_hash, role, is_active
            FROM {schema}.companies 
            WHERE login = %s
        """, (login_str,))
        user = cur.fetchone()
        
        if not user:
            return error_response('Неверный логин или пароль', 401)
        
        if not user['is_active']:
            return error_response('Аккаунт деактивирован', 403)
        
        # Проверка пароля
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return error_response('Неверный логин или пароль', 401)
        
        # Возвращаем ID компании как токен (упрощенная авторизация)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'token': str(user['id']),
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'login': user['login'],
                    'role': user['role']
                }
            }),
            'isBase64Encoded': False
        }

def get_current_user(conn, schema, auth_header):
    if not auth_header.startswith('Bearer '):
        return error_response('Требуется авторизация', 401)
    
    token = auth_header.replace('Bearer ', '')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            SELECT id, name, login, role, is_active
            FROM {schema}.companies 
            WHERE id = %s
        """, (token,))
        user = cur.fetchone()
        
        if not user:
            return error_response('Пользователь не найден', 404)
        
        if not user['is_active']:
            return error_response('Аккаунт деактивирован', 403)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(user)),
            'isBase64Encoded': False
        }

def error_response(message: str, status_code: int):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }