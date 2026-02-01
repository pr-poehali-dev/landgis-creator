import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';

interface AddElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: DisplayConfig['configType']) => void;
}

const AddElementDialog = ({ open, onOpenChange, onAdd }: AddElementDialogProps) => {
  const elements = [
    {
      type: 'attribute' as const,
      icon: 'Type',
      title: 'Атрибут',
      description: 'Текстовое поле с данными',
      color: 'text-blue-400'
    },
    {
      type: 'button' as const,
      icon: 'MousePointerClick',
      title: 'Кнопка',
      description: 'Кликабельная кнопка действия',
      color: 'text-green-400'
    },
    {
      type: 'iframe' as const,
      icon: 'Code2',
      title: 'Iframe',
      description: 'Встраиваемый контент',
      color: 'text-purple-400'
    },
    {
      type: 'image' as const,
      icon: 'Image',
      title: 'Изображение',
      description: 'Картинка или фото',
      color: 'text-orange-400'
    },
    {
      type: 'document' as const,
      icon: 'FileText',
      title: 'Файл',
      description: 'Документ для скачивания',
      color: 'text-yellow-400'
    },
    {
      type: 'contact_button' as const,
      icon: 'Phone',
      title: 'Кнопка связи',
      description: 'Телефон, email, мессенджер',
      color: 'text-pink-400'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить элемент</DialogTitle>
          <DialogDescription>
            Выберите тип элемента для добавления в карточку объекта
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {elements.map((element) => (
            <button
              key={element.type}
              onClick={() => {
                onAdd(element.type);
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all text-left group"
            >
              <Icon 
                name={element.icon as any} 
                size={32} 
                className={`${element.color} group-hover:scale-110 transition-transform`}
              />
              <div className="text-center">
                <div className="text-sm font-semibold">{element.title}</div>
                <div className="text-xs text-muted-foreground">{element.description}</div>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddElementDialog;
