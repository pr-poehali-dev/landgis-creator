import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { propertyService } from '@/services/propertyService';

interface PolygonStyle {
  attribute_key: string;
  attribute_value: string;
  fill_color: string;
  fill_opacity: number;
  stroke_color: string;
  stroke_width: number;
}

const PolygonStyleSettings = () => {
  const [activeAttribute, setActiveAttribute] = useState<string>('segment');
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);
  const [attributeValues, setAttributeValues] = useState<string[]>([]);
  const [styles, setStyles] = useState<PolygonStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeAttribute) {
      loadAttributeValues();
      loadStyles();
    }
  }, [activeAttribute]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const properties = await propertyService.getProperties();
      
      const attrs = new Set<string>();
      attrs.add('segment');
      attrs.add('status');
      attrs.add('type');
      
      properties.forEach(p => {
        if (p.attributes) {
          Object.keys(p.attributes).forEach(key => attrs.add(key));
        }
      });
      
      setAvailableAttributes(Array.from(attrs).sort());
      
      const response = await fetch('https://functions.poehali.dev/b947d498-cdee-47dc-a023-88238f54cc5d');
      if (response.ok) {
        const data = await response.json();
        setActiveAttribute(data.active_attribute || 'segment');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttributeValues = async () => {
    try {
      const properties = await propertyService.getProperties();
      const values = new Set<string>();
      
      properties.forEach(p => {
        let value = null;
        
        if (activeAttribute === 'segment') {
          value = p.attributes?.segment || p.segment;
        } else if (activeAttribute === 'status') {
          value = p.status;
        } else if (activeAttribute === 'type') {
          value = p.type;
        } else {
          value = p.attributes?.[activeAttribute];
        }
        
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => values.add(v));
          } else {
            values.add(String(value));
          }
        }
      });
      
      setAttributeValues(Array.from(values).sort());
    } catch (error) {
      console.error('Error loading attribute values:', error);
    }
  };

  const loadStyles = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/de96a125-7f5a-4aa7-b466-17e6e98c55c7?attribute_key=${activeAttribute}`);
      if (response.ok) {
        const data = await response.json();
        setStyles(data);
      }
    } catch (error) {
      console.error('Error loading styles:', error);
    }
  };

  const getStyleForValue = (value: string): PolygonStyle => {
    const existing = styles.find(s => s.attribute_value === value);
    if (existing) return existing;
    
    return {
      attribute_key: activeAttribute,
      attribute_value: value,
      fill_color: '#ff6b35',
      fill_opacity: 0.25,
      stroke_color: '#ff6b35',
      stroke_width: 2
    };
  };

  const updateStyle = (value: string, updates: Partial<PolygonStyle>) => {
    setStyles(prev => {
      const existing = prev.find(s => s.attribute_value === value);
      if (existing) {
        return prev.map(s => 
          s.attribute_value === value ? { ...s, ...updates } : s
        );
      } else {
        return [...prev, { ...getStyleForValue(value), ...updates }];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('https://functions.poehali.dev/de96a125-7f5a-4aa7-b466-17e6e98c55c7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_attribute: activeAttribute,
          styles: styles
        })
      });
      
      toast.success('Настройки стилей сохранены');
      window.dispatchEvent(new Event('polygon-styles-updated'));
    } catch (error) {
      console.error('Error saving styles:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Настройка дизайна участков</h1>
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
              <CardTitle>Атрибут для стилизации</CardTitle>
              <CardDescription>
                Выберите атрибут, по которому будут окрашиваться участки на карте
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Активный атрибут</Label>
                <Select value={activeAttribute} onValueChange={setActiveAttribute}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAttributes.map(attr => (
                      <SelectItem key={attr} value={attr}>
                        {attr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Стили для значений атрибута "{activeAttribute}"</CardTitle>
              <CardDescription>
                Настройте цвет и границы для каждого значения
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {attributeValues.map(value => {
                  const style = getStyleForValue(value);
                  return (
                    <div key={value} className="p-4 border border-border rounded-lg space-y-4">
                      <h3 className="font-medium text-lg">{value}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Цвет заливки</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={style.fill_color}
                              onChange={(e) => updateStyle(value, { fill_color: e.target.value })}
                              className="w-20"
                            />
                            <Input
                              type="text"
                              value={style.fill_color}
                              onChange={(e) => updateStyle(value, { fill_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Прозрачность заливки: {Math.round(style.fill_opacity * 100)}%</Label>
                          <Slider
                            value={[style.fill_opacity * 100]}
                            onValueChange={([val]) => updateStyle(value, { fill_opacity: val / 100 })}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Цвет границы</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={style.stroke_color}
                              onChange={(e) => updateStyle(value, { stroke_color: e.target.value })}
                              className="w-20"
                            />
                            <Input
                              type="text"
                              value={style.stroke_color}
                              onChange={(e) => updateStyle(value, { stroke_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Ширина границы: {style.stroke_width}px</Label>
                          <Slider
                            value={[style.stroke_width]}
                            onValueChange={([val]) => updateStyle(value, { stroke_width: val })}
                            min={1}
                            max={10}
                            step={1}
                          />
                        </div>
                      </div>

                      <div 
                        className="h-20 rounded border-2 transition-all"
                        style={{
                          backgroundColor: style.fill_color,
                          opacity: style.fill_opacity,
                          borderColor: style.stroke_color,
                          borderWidth: `${style.stroke_width}px`
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PolygonStyleSettings;