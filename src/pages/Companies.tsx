import { useState, useEffect } from 'react';
import { authService, companiesService, Company } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    role: 'user',
    inn: '',
    kpp: '',
    legal_address: '',
    contact_email: '',
    contact_phone: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await companiesService.getAll();
      setCompanies(data);
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCompany) {
        await companiesService.update({ id: editingCompany.id, ...formData });
      } else {
        await companiesService.create(formData);
      }
      await loadCompanies();
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      login: company.login,
      password: '',
      role: company.role,
      inn: company.inn || '',
      kpp: company.kpp || '',
      legal_address: company.legal_address || '',
      contact_email: company.contact_email || '',
      contact_phone: company.contact_phone || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите деактивировать эту компанию?')) return;

    try {
      await companiesService.delete(id);
      await loadCompanies();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      login: '',
      password: '',
      role: 'user',
      inn: '',
      kpp: '',
      legal_address: '',
      contact_email: '',
      contact_phone: ''
    });
    setEditingCompany(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <Icon name="AlertCircle" size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Управление компаниями
          </h2>
          <Button onClick={() => setShowForm(!showForm)}>
            <Icon name={showForm ? 'X' : 'Plus'} size={16} className="mr-2" />
            {showForm ? 'Отмена' : 'Добавить компанию'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingCompany ? 'Редактирование компании' : 'Новая компания'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Логин *
                    </label>
                    <Input
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль {!editingCompany && '*'}
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingCompany}
                      placeholder={editingCompany ? 'Оставьте пустым, если не меняете' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Роль *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ИНН
                    </label>
                    <Input
                      value={formData.inn}
                      onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      КПП
                    </label>
                    <Input
                      value={formData.kpp}
                      onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Юридический адрес
                    </label>
                    <Input
                      value={formData.legal_address}
                      onChange={(e) => setFormData({ ...formData, legal_address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingCompany ? 'Сохранить' : 'Создать'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Логин</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.login}</TableCell>
                    <TableCell>
                      <Badge variant={company.role === 'admin' ? 'default' : 'secondary'}>
                        {company.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.is_active ? 'default' : 'secondary'}>
                        {company.is_active ? 'Активна' : 'Неактивна'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(company)}
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(company.id)}
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Companies;
