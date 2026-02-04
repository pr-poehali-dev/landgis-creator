const AUTH_API_URL = 'https://functions.poehali.dev/3db334e8-0963-44c2-a7d5-f56cc9fd64a6';
const COMPANIES_API_URL = 'https://functions.poehali.dev/a1ecb3f4-eea9-4fdd-9f5a-e4525374d77e';

export interface User {
  id: number;
  name: string;
  login: string;
  role: string;
}

export interface Company {
  id: number;
  name: string;
  login: string;
  password?: string;
  role: string;
  inn?: string;
  kpp?: string;
  legal_address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const authService = {
  async login(login: string, password: string): Promise<{ token: string; user: User }> {
    const response = await fetch(`${AUTH_API_URL}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка авторизации');
    }

    const data = await response.json();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${AUTH_API_URL}?action=me`, {
      headers: { 'X-Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Сессия истекла');
    }

    return await response.json();
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }
};

export const companiesService = {
  async getAll(): Promise<Company[]> {
    const token = authService.getToken();
    const response = await fetch(COMPANIES_API_URL, {
      headers: { 'X-Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Ошибка загрузки компаний');
    }

    return await response.json();
  },

  async create(data: Partial<Company> & { password: string }): Promise<Company> {
    const token = authService.getToken();
    const response = await fetch(COMPANIES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка создания компании');
    }

    return await response.json();
  },

  async update(data: Partial<Company>): Promise<Company> {
    const token = authService.getToken();
    const response = await fetch(COMPANIES_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка обновления компании');
    }

    return await response.json();
  },

  async delete(id: number): Promise<void> {
    const token = authService.getToken();
    const response = await fetch(`${COMPANIES_API_URL}?id=${id}`, {
      method: 'DELETE',
      headers: { 'X-Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error('Ошибка удаления компании');
    }
  }
};