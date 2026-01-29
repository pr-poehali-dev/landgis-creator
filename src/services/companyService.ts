import urls from '../../backend/func2url.json';

export interface Company {
  id: number;
  name: string;
  inn?: string;
  kpp?: string;
  legal_address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class CompanyService {
  private apiUrl = urls['companies'];
  private cache: Company[] | null = null;
  private subscribers: ((companies: Company[]) => void)[] = [];

  async getCompanies(): Promise<Company[]> {
    if (this.cache) {
      return this.cache;
    }

    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }
    
    const companies = await response.json();
    this.cache = companies;
    return companies;
  }

  async getCompany(id: number): Promise<Company> {
    const response = await fetch(`${this.apiUrl}?id=${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch company');
    }
    return response.json();
  }

  async createCompany(data: {
    name: string;
    inn?: string;
    kpp?: string;
    legalAddress?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive?: boolean;
  }): Promise<Company> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create company');
    }

    this.cache = null;
    const company = await response.json();
    await this.notifySubscribers();
    return company;
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Company> {
    const response = await fetch(this.apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      throw new Error('Failed to update company');
    }

    this.cache = null;
    const company = await response.json();
    await this.notifySubscribers();
    return company;
  }

  subscribe(callback: (companies: Company[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private async notifySubscribers(): Promise<void> {
    const companies = await this.getCompanies();
    this.subscribers.forEach(callback => callback(companies));
  }

  clearCache(): void {
    this.cache = null;
  }
}

export const companyService = new CompanyService();
