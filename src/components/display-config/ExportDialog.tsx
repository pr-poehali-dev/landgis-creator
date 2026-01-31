import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configJson: string;
}

const ExportDialog = ({ open, onOpenChange, configJson }: ExportDialogProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(configJson)
      .then(() => toast.success('Скопировано в буфер обмена!'))
      .catch(() => toast.error('Не удалось скопировать. Выделите текст вручную.'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Экспорт настроек</DialogTitle>
          <DialogDescription>
            Скопируйте этот JSON и вставьте его в консоль браузера (F12) на странице с картой:
            <br />
            <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
              localStorage.setItem('displayConfigs', '{`вставьте JSON сюда`}')
            </code>
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={configJson}
          readOnly
          className="font-mono text-xs h-96"
          onClick={(e) => e.currentTarget.select()}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button onClick={handleCopy}>
            Скопировать JSON
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
