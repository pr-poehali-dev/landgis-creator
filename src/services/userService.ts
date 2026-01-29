import urls from '../../backend/func2url.json';

export interface User {
  id: number;
  company_id?: number;
  company_name?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class UserService {
  private apiUrl = urls['users'];
  private cache: User[] | null = null;
  private subscribers: ((users: User[]) => void)[] = [];

  async getUsers(): Promise<User[]> {
    if (this.cache) {
      return this.cache;
    }

    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await response.json();
    this.cache = users;
    return users;
  }

  async getUser(id: number): Promise<User> {
    const response = await fetch(`${this.apiUrl}?id=${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  }

  async createUser(data: {
    companyId?: number;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    isActive?: boolean;
  }): Promise<User> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    this.cache = null;
    const user = await response.json();
    await this.notifySubscribers();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await fetch(this.apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    this.cache = null;
    const user = await response.json();
    await this.notifySubscribers();
    return user;
  }

  subscribe(callback: (users: User[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private async notifySubscribers(): Promise<void> {
    const users = await this.getUsers();
    this.subscribers.forEach(callback => callback(users));
  }

  clearCache(): void {
    this.cache = null;
  }
}

export const userService = new UserService();
