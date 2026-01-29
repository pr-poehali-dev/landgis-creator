import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { companyService, Company } from '@/services/companyService';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    inn: '',
    kpp: '',
    legalAddress: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true
  });

  useEffect(() => {
    loadCompanies();
    const unsubscribe = companyService.subscribe((updatedCompanies) => {
      setCompanies(updatedCompanies);
    });
    return unsubscribe;
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Не удалось загрузить компании');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        inn: company.inn || '',
        kpp: company.kpp || '',
        legalAddress: company.legal_address || '',
        contactEmail: company.contact_email || '',
        contactPhone: company.contact_phone || '',
        isActive: company.is_active
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        inn: '',
        kpp: '',
        legalAddress: '',
        contactEmail: '',
        contactPhone: '',
        isActive: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Укажите название компании');
      return;
    }

    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, formData);
        toast.success('Компания обновлена');
      } else {
        await companyService.createCompany(formData);
        toast.success('Компания создана');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Не удалось сохранить компанию');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Icon name="Building2" className="text-primary" size={28} />
                  Компании
                </h1>
                <p className="text-sm text-muted-foreground">Организации-собственники и партнёры</p>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить компанию
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Список компаний</CardTitle>
            <CardDescription>Всего компаний: {companies.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader2" className="animate-spin text-primary" size={32} />
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Building2" className="mx-auto mb-4 opacity-20" size={48} />
                <p>Нет компаний</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>ИНН</TableHead>
                    <TableHead>КПП</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создана</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="font-mono text-xs">{company.inn || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{company.kpp || '—'}</TableCell>
                      <TableCell className="text-sm">{company.contact_email || '—'}</TableCell>
                      <TableCell className="text-sm">{company.contact_phone || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={company.is_active ? 'default' : 'secondary'}>
                          {company.is_active ? 'Активна' : 'Неактивна'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(company.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(company)}
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? 'Редактировать компанию' : 'Новая компания'}
            </DialogTitle>
            <DialogDescription>
              {editingCompany ? 'Изменение данных компании' : 'Добавление новой компании'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inn">ИНН</Label>
                <Input
                  id="inn"
                  value={formData.inn}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpp">КПП</Label>
                <Input
                  id="kpp"
                  value={formData.kpp}
                  onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Юридический адрес</Label>
              <Input
                id="address"
                value={formData.legalAddress}
                onChange={(e) => setFormData({ ...formData, legalAddress: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Активна</Label>
              <input
                id="active"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Companies;
