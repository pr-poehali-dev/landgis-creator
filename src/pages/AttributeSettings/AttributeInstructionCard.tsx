import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AttributeInstructionCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Инструкция</CardTitle>
        <CardDescription>Как работают настройки атрибутов</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>• <strong>Синхронизировать из БД</strong> — автоматически найти все атрибуты из загруженных объектов</p>
        <p>• <strong>Название (латиница)</strong> — ключ атрибута из GeoJSON файла</p>
        <p>• <strong>Отображаемое имя</strong> — название, которое увидят пользователи</p>
        <p>• <strong>Перетаскивание строк</strong> — измените порядок отображения атрибутов</p>
        <p>• <strong>Видимость в таблице</strong> — показывать ли атрибут в основной таблице</p>
        <p>• <strong>Роли</strong> — для каких пользователей доступен атрибут (admin/user)</p>
      </CardContent>
    </Card>
  );
};
