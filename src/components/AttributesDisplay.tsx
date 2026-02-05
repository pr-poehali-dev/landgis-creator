import { useState } from 'react';
import { UserRole, canAccessAttribute } from '@/types/userRoles';
import AttributeEditField from '@/components/attributes/AttributeEditField';
import AttributeViewMode from '@/components/attributes/AttributeViewMode';
import AttributeConfigMode from '@/components/attributes/AttributeConfigMode';
import { useAttributeConfigs } from '@/components/attributes/useAttributeConfigs';
import { useAttributeEditing } from '@/components/attributes/useAttributeEditing';
import { visibilityService } from '@/services/visibilityService';

interface AttributesDisplayProps {
  attributes?: Record<string, any>;
  userRole?: string;
  featureId?: number;
  onAttributesUpdate?: (attributes: Record<string, any>) => void;
}

const AttributesDisplay = ({ attributes, userRole = 'user1', featureId, onAttributesUpdate }: AttributesDisplayProps) => {
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    configs,
    loadConfigs,
    saveConfigs,
    cleanupObsoleteAttributes,
    handleConfigChange,
    moveConfig,
    toggleConfigEnabled,
    deleteConfig,
    addConfig
  } = useAttributeConfigs(attributes);

  const {
    isEditing,
    editedAttributes,
    handleSave,
    handleCancel,
    handleAttributeChange,
    initializeEditMode
  } = useAttributeEditing(attributes, featureId, onAttributesUpdate);

  if (!attributes || Object.keys(attributes).length === 0) {
    return <div className="text-sm text-muted-foreground">Нет атрибутов</div>;
  }

  const renderEditField = (key: string, value: any, config?: any) => {
    return (
      <AttributeEditField
        value={value}
        config={config}
        onValueChange={(newValue) => {
          console.log('renderEditField onValueChange:', { key, newValue });
          handleAttributeChange(key, newValue);
        }}
      />
    );
  };

  const displayAttributes = isEditing ? editedAttributes : attributes;
  const enabledConfigs = configs.filter(c => {
    // Сначала проверяем новую систему видимости (приоритет)
    const attributePath = `attributes.${c.originalKey || c.configKey}`;
    const hasNewSystemAccess = visibilityService.isAttributeVisible(attributePath, userRole as UserRole);
    
    console.log(`🔍 Атрибут ${c.configKey}:`, {
      attributePath,
      userRole,
      hasNewSystemAccess,
      enabled: c.enabled,
      visibleRoles: c.visibleRoles,
      visibleRolesContent: JSON.stringify(c.visibleRoles),
      includesUserRole: c.visibleRoles?.includes(userRole),
      originalKey: c.originalKey
    });
    
    // Если новая система запретила — скрываем сразу
    if (!hasNewSystemAccess) {
      console.log(`❌ Скрыт новой системой: ${c.configKey}`);
      return false;
    }
    
    // Если новая система разрешила, проверяем старую систему (конфиги атрибутов)
    const hasOldSystemAccess = c.enabled && canAccessAttribute(userRole as UserRole, c.visibleRoles);
    
    if (!hasOldSystemAccess) {
      console.log(`❌ Скрыт старой системой: ${c.configKey}`, { enabled: c.enabled, visibleRoles: c.visibleRoles });
    }
    
    if (isEditing && c.configType === 'attribute') {
      return hasOldSystemAccess;
    }
    const hasData = attributes && (attributes[c.originalKey || c.configKey] !== undefined);
    
    if (!hasData) {
      console.log(`❌ Нет данных для: ${c.configKey}`);
    }
    
    const result = hasOldSystemAccess && hasData;
    if (result) {
      console.log(`✅ Показываем: ${c.configKey}`);
    }
    
    return result;
  });

  if (isConfigMode) {
    return (
      <AttributeConfigMode
        configs={configs}
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        onCancel={() => {
          loadConfigs();
          setIsConfigMode(false);
        }}
        onSave={async () => {
          await saveConfigs(onAttributesUpdate);
          setIsConfigMode(false);
        }}
        onCleanup={cleanupObsoleteAttributes}
        onConfigChange={handleConfigChange}
        onMoveConfig={moveConfig}
        onToggleEnabled={toggleConfigEnabled}
        onDelete={deleteConfig}
        onAdd={addConfig}
      />
    );
  }

  return (
    <AttributeViewMode
      configs={enabledConfigs}
      attributes={displayAttributes}
      editedAttributes={editedAttributes}
      isEditing={isEditing}
      onEdit={() => initializeEditMode(configs, attributes)}
      onConfigure={() => setIsConfigMode(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      renderEditField={renderEditField}
    />
  );
};

export default AttributesDisplay;