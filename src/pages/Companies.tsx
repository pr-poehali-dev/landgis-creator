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

const roles = [
  { value: 'free', label: 'Бесплатный' },
  { value: 'lite', label: 'Лайт' },
  { value: 'max', label: 'Макс' },
  { value: 'vip', label: 'VIP' },
  { value: 'admin', label: 'Администратор' }
];

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [error, setError] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    passwordConfirm: '',
    role: 'free',
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
      console.log('🔍 Loading companies, token:', authService.getToken());
      console.log('🔍 Current user:', authService.getUser());
      const data = await companiesService.getAll();
      console.log('✅ Companies loaded:', data.length);
      setCompanies(data);
      setError('');
    } catch (err) {
      console.error('❌ Load companies error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('🔵 Submit form', { editingCompany, formData });

    if (!editingCompany && formData.password !== formData.passwordConfirm) {
      console.error('❌ Passwords do not match');
      setError('Пароли не совпадают');
      return;
    }

    if (!editingCompany && formData.password.length < 6) {
      console.error('❌ Password too short');
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      const dataToSend = { ...formData };
      delete (dataToSend as any).passwordConfirm;
      
      console.log('📤 Sending data:', dataToSend);
      
      if (editingCompany) {
        if (!dataToSend.password) {
          delete (dataToSend as any).password;
        }
        console.log('🔄 Updating company...');
        await companiesService.update({ id: editingCompany.id, ...dataToSend });
      } else {
        console.log('➕ Creating company...');
        await companiesService.create(dataToSend);
      }
      console.log('✅ Success!');
      await loadCompanies();
      resetForm();
    } catch (err: unknown) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      login: company.login,
      password: '',
      passwordConfirm: '',
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
      passwordConfirm: '',
      role: 'free',
      inn: '',
      kpp: '',
      legal_address: '',
      contact_email: '',
      contact_phone: ''
    });
    setEditingCompany(null);
    setShowForm(false);
    setError('');
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleActiveStatus = async (company: Company) => {
    if (company.role === 'admin') {
      setError('Нельзя деактивировать аккаунт администратора');
      return;
    }

    try {
      console.log('🔄 Toggling active status for company:', company.id, 'from', company.is_active, 'to', !company.is_active);
      await companiesService.update({
        id: company.id,
        is_active: !company.is_active
      });
      console.log('✅ Status toggled successfully');
      await loadCompanies();
    } catch (err: unknown) {
      console.error('❌ Error toggling status:', err);
      setError(err instanceof Error ? err.message : 'Ошибка изменения статуса');
    }
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
          <h2 className="text-xl font-semibold text-gray-200">
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
              <h3 className="text-lg font-semibold mb-4 text-gray-200">
                {editingCompany ? 'Редактирование компании' : 'Новая компания'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Название *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Логин *
                    </label>
                    <Input
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Пароль {!editingCompany && '*'}
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingCompany}
                      placeholder={editingCompany ? 'Оставьте пустым, если не меняете' : 'Минимум 6 символов'}
                    />
                  </div>

                  {!editingCompany && (
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">
                        Повторите пароль *
                      </label>
                      <Input
                        type="password"
                        value={formData.passwordConfirm}
                        onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                        required
                        placeholder="Повторите пароль"
                      />
                    </div>
                  )}

                  <div className={!editingCompany ? '' : 'md:col-start-2'}>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Роль *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      ИНН
                    </label>
                    <Input
                      value={formData.inn}
                      onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      КПП
                    </label>
                    <Input
                      value={formData.kpp}
                      onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Телефон
                    </label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">
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
            {companies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Компании не найдены
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Логин</TableHead>
                    <TableHead>Пароль</TableHead>
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
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {visiblePasswords.has(company.id) 
                              ? company.password || 'не задан'
                              : '••••••••'
                            }
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => togglePasswordVisibility(company.id)}
                          >
                            <Icon 
                              name={visiblePasswords.has(company.id) ? 'EyeOff' : 'Eye'} 
                              size={14} 
                            />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.role === 'admin' ? 'default' : 'secondary'}>
                          {roles.find(r => r.value === company.role)?.label || company.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={company.is_active ? 'default' : 'secondary'}
                            className={company.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
                          >
                            {company.is_active ? 'Активна' : 'Неактивна'}
                          </Badge>
                          {company.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleActiveStatus(company)}
                              title={company.is_active ? 'Деактивировать' : 'Активировать'}
                            >
                              <Icon 
                                name={company.is_active ? 'ToggleRight' : 'ToggleLeft'} 
                                size={20}
                                className={company.is_active ? 'text-green-500' : 'text-gray-400'}
                              />
                            </Button>
                          )}
                        </div>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Companies;