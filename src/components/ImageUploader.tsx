import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageChange: (url: string) => void;
  aspectRatio?: string;
  maxSizeMB?: number;
}

export const ImageUploader = ({
  currentImageUrl = '',
  onImageChange,
  aspectRatio = 'auto',
  maxSizeMB = 5
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Файл слишком большой. Максимум ${maxSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onImageChange(result);
        setUrlInput(result);
        toast.success('Изображение загружено');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      onImageChange(urlInput);
      toast.success('URL сохранен');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {currentImageUrl ? (
          <div className="space-y-2">
            <img
              src={currentImageUrl}
              alt="Загруженное изображение"
              className="max-h-32 mx-auto rounded"
              style={{ aspectRatio }}
            />
            <p className="text-xs text-muted-foreground">Нажмите или перетащите для замены</p>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            <Icon name="Upload" size={32} className="mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isUploading ? 'Загрузка...' : 'Перетащите файл или нажмите для выбора'}
            </p>
            <p className="text-xs text-muted-foreground">Максимум {maxSizeMB}MB</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Или вставьте URL изображения"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <Button onClick={handleUrlSubmit} variant="outline" size="sm">
          <Icon name="Check" size={16} />
        </Button>
      </div>
    </div>
  );
};
