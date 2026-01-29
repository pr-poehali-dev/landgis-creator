import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { mapSettingsService, MapSetting } from '@/services/mapSettingsService';
import AdminNavigation from '@/components/admin/AdminNavigation';

const MapSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<MapSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await mapSettingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading map settings:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const setting of settings) {
        await mapSettingsService.upsertSetting(
          setting.setting_key,
          setting.setting_value,
          setting.description
        );
      }
      toast.success('Настройки сохранены');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev =>
      prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
    );
  };

  const getSetting = (key: string): string => {
    return settings.find(s => s.setting_key === key)?.setting_value || '';
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
              <CardTitle>Положение по умолчанию</CardTitle>
              <CardDescription>Центр карты и масштаб при загрузке</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Широта</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.000001"
                    value={getSetting('default_center_lat')}
                    onChange={(e) => updateSetting('default_center_lat', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lon">Долгота</Label>
                  <Input
                    id="lon"
                    type="number"
                    step="0.000001"
                    value={getSetting('default_center_lon')}
                    onChange={(e) => updateSetting('default_center_lon', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoom">Масштаб (1-18)</Label>
                <Input
                  id="zoom"
                  type="number"
                  min="1"
                  max="18"
                  value={getSetting('default_zoom')}
                  onChange={(e) => updateSetting('default_zoom', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Стиль карты</CardTitle>
              <CardDescription>Внешний вид карты</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="style">Стиль отображения</Label>
                <Input
                  id="style"
                  value={getSetting('map_style')}
                  onChange={(e) => updateSetting('map_style', e.target.value)}
                  placeholder="default, satellite, hybrid"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Цвета и оформление</CardTitle>
              <CardDescription>Цвета маркеров и границ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marker-color">Цвет маркеров</Label>
                  <div className="flex gap-2">
                    <Input
                      id="marker-color"
                      type="color"
                      value={getSetting('marker_color')}
                      onChange={(e) => updateSetting('marker_color', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={getSetting('marker_color')}
                      onChange={(e) => updateSetting('marker_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boundary-color">Цвет границ</Label>
                  <div className="flex gap-2">
                    <Input
                      id="boundary-color"
                      type="color"
                      value={getSetting('boundary_color')}
                      onChange={(e) => updateSetting('boundary_color', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={getSetting('boundary_color')}
                      onChange={(e) => updateSetting('boundary_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="boundary-width">Толщина линий границ</Label>
                <Input
                  id="boundary-width"
                  type="number"
                  min="1"
                  max="10"
                  value={getSetting('boundary_width')}
                  onChange={(e) => updateSetting('boundary_width', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Элементы управления</CardTitle>
              <CardDescription>Видимость элементов интерфейса</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-controls">Показывать элементы управления</Label>
                <input
                  id="show-controls"
                  type="checkbox"
                  checked={getSetting('show_controls') === 'true'}
                  onChange={(e) => updateSetting('show_controls', e.target.checked ? 'true' : 'false')}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-search">Показывать поиск на карте</Label>
                <input
                  id="show-search"
                  type="checkbox"
                  checked={getSetting('show_search') === 'true'}
                  onChange={(e) => updateSetting('show_search', e.target.checked ? 'true' : 'false')}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapSettings;