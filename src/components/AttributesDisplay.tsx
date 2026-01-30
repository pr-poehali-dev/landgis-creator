import { useState, useEffect } from 'react';
import { displayConfigService, DisplayConfig } from '@/services/displayConfigService';

interface AttributesDisplayProps {
  attributes?: Record<string, any>;
  userRole?: string;
}

const AttributesDisplay = ({ attributes, userRole = 'user' }: AttributesDisplayProps) => {
  const [configs, setConfigs] = useState<DisplayConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const allConfigs = await displayConfigService.getConfigs('attribute');
      setConfigs(allConfigs);
    } catch (error) {
      console.error('Error loading display configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!attributes || Object.keys(attributes).length === 0) {
    return <div className="text-sm text-muted-foreground">Нет атрибутов</div>;
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>;
  }

  const enabledConfigs = configs
    .filter(c => c.enabled && displayConfigService.isVisibleForRole(c, userRole))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
  
  const orderedKeys = [
    ...enabledConfigs
      .map(c => c.configKey)
      .filter(key => attributeKeys.includes(key)),
    ...attributeKeys.filter(key => !enabledConfigs.find(c => c.configKey === key))
  ];

  const getDisplayName = (key: string): string => {
    const config = configs.find(c => c.configKey === key);
    return config?.displayName || key;
  };

  return (
    <>
      {orderedKeys.map((key) => (
        <div key={key} className="pb-3 border-b border-border last:border-0">
          <p className="text-xs font-semibold text-primary mb-1">
            {getDisplayName(key)}
          </p>
          <p className="text-sm text-foreground break-words whitespace-pre-wrap">
            {attributes[key] !== null && attributes[key] !== undefined 
              ? String(attributes[key]) 
              : '—'}
          </p>
        </div>
      ))}
    </>
  );
};

export default AttributesDisplay;
