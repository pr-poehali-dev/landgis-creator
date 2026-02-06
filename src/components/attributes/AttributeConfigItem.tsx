import { DisplayConfig } from '@/services/displayConfigService';
import { ConfigHeader } from './ConfigHeader';
import { FormatTypeSelector } from './FormatTypeSelector';
import { ConditionalDisplaySettings } from './ConditionalDisplaySettings';
import { RoleSelector } from './RoleSelector';

interface AttributeConfigItemProps {
  config: DisplayConfig;
  index: number;
  totalConfigs: number;
  allConfigs: DisplayConfig[];
  onConfigChange: (index: number, field: keyof DisplayConfig, value: any) => void;
  onMoveConfig: (index: number, direction: 'up' | 'down') => void;
  onToggleEnabled: (index: number) => void;
  onDelete: (index: number) => void;
}

const AttributeConfigItem = ({
  config,
  index,
  totalConfigs,
  allConfigs,
  onConfigChange,
  onMoveConfig,
  onToggleEnabled,
  onDelete
}: AttributeConfigItemProps) => {
  const getAvailableValuesForDependency = (): string[] => {
    if (!config.conditionalDisplay?.dependsOn) {
      return [];
    }

    const dependentConfig = allConfigs.find(c => c.configKey === config.conditionalDisplay!.dependsOn);
    
    if (!dependentConfig) {
      return [];
    }

    if (dependentConfig.formatType === 'boolean') {
      return ['да', 'нет'];
    }

    if ((dependentConfig.formatType === 'select' || dependentConfig.formatType === 'multiselect') && dependentConfig.formatOptions?.options) {
      return dependentConfig.formatOptions.options;
    }

    return [];
  };

  const availableValues = getAvailableValuesForDependency();

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-card">
      <ConfigHeader
        config={config}
        index={index}
        totalConfigs={totalConfigs}
        onConfigChange={onConfigChange}
        onMoveConfig={onMoveConfig}
        onToggleEnabled={onToggleEnabled}
        onDelete={onDelete}
      />

      <FormatTypeSelector
        config={config}
        index={index}
        onConfigChange={onConfigChange}
      />

      <ConditionalDisplaySettings
        config={config}
        index={index}
        allConfigs={allConfigs}
        availableValues={availableValues}
        onConfigChange={onConfigChange}
      />

      <RoleSelector
        config={config}
        index={index}
        onConfigChange={onConfigChange}
      />
    </div>
  );
};

export default AttributeConfigItem;
