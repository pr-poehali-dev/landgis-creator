import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface MapActionButtonsProps {
  onAddProperty: () => void;
  onLogout: () => void;
}

const MapActionButtons = ({ onAddProperty, onLogout }: MapActionButtonsProps) => {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <Button 
        size="sm" 
        className="bg-primary hover:bg-primary/90 h-10 px-4 gap-2 shadow-lg"
        onClick={onAddProperty}
      >
        <Icon name="Plus" size={16} />
        <span>Добавить объект</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-10 px-4 gap-2 shadow-lg bg-card/95 backdrop-blur"
        onClick={onLogout}
      >
        <Icon name="LogOut" size={16} />
        <span>Выйти</span>
      </Button>
    </div>
  );
};

export default MapActionButtons;
