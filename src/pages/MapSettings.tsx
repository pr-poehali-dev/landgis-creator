import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { useAppSettings, AppSettings } from '@/hooks/useAppSettings';

const MapSettings = () => {
  const navigate = useNavigate();
  const { settings: appSettings, isLoading, saveSettings } = useAppSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(appSettings);
  }, [appSettings]);

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveSettings(localSettings);
      toast.success('Настройки дизайна сохранены');
      window.location.reload();
    } catch (error) {
      console.error('Error saving design settings:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const updateDesignSetting = (key: keyof AppSettings, value: string) => {
    let cleanValue = value;
    if (key === 'bgColor' || key === 'buttonColor') {
      cleanValue = value.replace(/[^a-f0-9#]/gi, '');
      if (!cleanValue.startsWith('#')) cleanValue = '#' + cleanValue;
      if (cleanValue.length > 7) cleanValue = cleanValue.substring(0, 7);
    }
    setLocalSettings(prev => ({ ...prev, [key]: cleanValue }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="flex justify-end mb-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Дизайн приложения</CardTitle>
              <CardDescription>Настройка внешнего вида и брендинга</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-logo">Логотип (URL)</Label>
                <Input
                  id="app-logo"
                  type="url"
                  value={localSettings.logo}
                  onChange={(e) => updateDesignSetting('logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-title">Заголовок приложения</Label>
                <Input
                  id="app-title"
                  value={localSettings.title}
                  onChange={(e) => updateDesignSetting('title', e.target.value)}
                  placeholder="LandGis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-subtitle">Подзаголовок</Label>
                <Input
                  id="app-subtitle"
                  value={localSettings.subtitle}
                  onChange={(e) => updateDesignSetting('subtitle', e.target.value)}
                  placeholder="Картографическая CRM"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bg-color">Основной цвет фона</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bg-color"
                      type="color"
                      value={localSettings.bgColor}
                      onChange={(e) => updateDesignSetting('bgColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={localSettings.bgColor}
                      onChange={(e) => updateDesignSetting('bgColor', e.target.value)}
                      className="flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button-color">Цвет кнопок</Label>
                  <div className="flex gap-2">
                    <Input
                      id="button-color"
                      type="color"
                      value={localSettings.buttonColor}
                      onChange={(e) => updateDesignSetting('buttonColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={localSettings.buttonColor}
                      onChange={(e) => updateDesignSetting('buttonColor', e.target.value)}
                      className="flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapSettings;