import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import func2url from '../../../backend/func2url.json';

const MigrateAttributeConfigsButton = () => {
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigrate = async () => {
    setIsMigrating(true);
    
    try {
      // Читаем из localStorage
      const localData = localStorage.getItem('attributeConfigs');
      
      if (!localData) {
        toast.error('Нет данных в localStorage для миграции');
        return;
      }
      
      const configs = JSON.parse(localData);
      
      // Сохраняем в БД
      const response = await fetch(func2url['attribute-configs'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs })
      });
      
      if (!response.ok) {
        throw new Error('Failed to migrate configs');
      }
      
      const result = await response.json();
      
      toast.success(`Настройки перенесены в БД (${result.count} атрибутов)`);
      
      // Опционально: удаляем из localStorage
      // localStorage.removeItem('attributeConfigs');
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Ошибка при переносе настроек');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMigrate}
      disabled={isMigrating}
      className="gap-2"
    >
      <Icon name="Database" size={16} />
      {isMigrating ? 'Переношу...' : 'Перенести из localStorage в БД'}
    </Button>
  );
};

export default MigrateAttributeConfigsButton;
