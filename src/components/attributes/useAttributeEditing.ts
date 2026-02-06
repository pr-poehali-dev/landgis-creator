import { useState, useEffect } from 'react';
import { DisplayConfig } from '@/services/displayConfigService';
import { toast } from 'sonner';
import func2url from '../../../backend/func2url.json';
import { propertyService } from '@/services/propertyService';

export const useAttributeEditing = (
  attributes?: Record<string, any>,
  featureId?: number,
  onAttributesUpdate?: (attributes: Record<string, any>) => void
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAttributes, setEditedAttributes] = useState<Record<string, any>>({});

  useEffect(() => {
    if (attributes) {
      setEditedAttributes(attributes);
    }
  }, [attributes]);

  const handleSave = async () => {
    console.log('handleSave called', { featureId, editedAttributes });
    
    if (!featureId) {
      toast.error('Не удалось определить объект');
      return;
    }

    try {
      const url = `${func2url['update-attributes']}?id=${featureId}`;
      const payload = { attributes: editedAttributes };
      
      console.log('Sending PUT request:', { url, payload });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to update attributes');
      }

      const result = await response.json();
      console.log('Save result:', result);

      // Обновляем кэш propertyService
      await propertyService.getProperties(true);

      toast.success('Атрибуты сохранены');
      setIsEditing(false);
      
      if (onAttributesUpdate) {
        try {
          onAttributesUpdate(editedAttributes);
        } catch (callbackError) {
          console.error('Error in onAttributesUpdate callback:', callbackError);
        }
      }
    } catch (error) {
      console.error('Error saving attributes:', error);
      toast.error('Не удалось сохранить атрибуты');
    }
  };

  const handleCancel = () => {
    setEditedAttributes(attributes || {});
    setIsEditing(false);
  };

  const handleAttributeChange = (key: string, value: string) => {
    console.log('handleAttributeChange:', { key, value, type: typeof value });
    // Если value это строка с JSON ("\"\""), распарсим её
    let processedValue = value;
    if (typeof value === 'string' && value.startsWith('"\\"') && value.endsWith('\\""')) {
      try {
        processedValue = JSON.parse(value);
      } catch {
        processedValue = value;
      }
    }
    
    setEditedAttributes(prev => {
      const updated = {
        ...prev,
        [key]: processedValue
      };
      console.log('Updated editedAttributes:', updated);
      return updated;
    });
  };

  const initializeEditMode = (configs: DisplayConfig[], attributes?: Record<string, any>) => {
    const initialEdited = { ...(attributes || {}) };
    
    configs.forEach(config => {
      if (config.configType === 'attribute') {
        const key = config.originalKey || config.configKey;
        if (initialEdited[key] === undefined) {
          initialEdited[key] = config.formatType === 'toggle' ? 'false' : '';
        }
      }
    });
    
    console.log('Initializing edit mode:', initialEdited);
    setEditedAttributes(initialEdited);
    setIsEditing(true);
  };

  return {
    isEditing,
    setIsEditing,
    editedAttributes,
    setEditedAttributes,
    handleSave,
    handleCancel,
    handleAttributeChange,
    initializeEditMode
  };
};