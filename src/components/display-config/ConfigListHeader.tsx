import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';

interface ConfigListHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreateConfig: (type: DisplayConfig['configType']) => void;
}

const ConfigListHeader = ({ activeTab, onTabChange, onCreateConfig }: ConfigListHeaderProps) => {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Окно атрибутов</h2>
        <p className="text-muted-foreground">
          Настройте порядок отображения атрибутов и элементов на карточке объекта.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Все элементы</TabsTrigger>
          <TabsTrigger value="attribute">Атрибуты</TabsTrigger>
          <TabsTrigger value="image">Изображения</TabsTrigger>
          <TabsTrigger value="document">Документы</TabsTrigger>
          <TabsTrigger value="contact_button">Кнопки</TabsTrigger>
          <TabsTrigger value="custom_element">Другое</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2 mb-4">
        <Button onClick={() => onCreateConfig('attribute')} size="sm">
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить атрибут
        </Button>
        <Button onClick={() => onCreateConfig('image')} variant="outline" size="sm">
          <Icon name="Image" size={16} className="mr-2" />
          Изображения
        </Button>
        <Button onClick={() => onCreateConfig('document')} variant="outline" size="sm">
          <Icon name="FileText" size={16} className="mr-2" />
          Документы
        </Button>
        <Button onClick={() => onCreateConfig('contact_button')} variant="outline" size="sm">
          <Icon name="Phone" size={16} className="mr-2" />
          Кнопка связи
        </Button>
      </div>
    </>
  );
};

export default ConfigListHeader;