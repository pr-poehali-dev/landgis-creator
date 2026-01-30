interface AttributesDisplayProps {
  attributes?: Record<string, any>;
  userRole?: string;
}

const AttributesDisplay = ({ attributes }: AttributesDisplayProps) => {
  if (!attributes || Object.keys(attributes).length === 0) {
    return <div className="text-sm text-muted-foreground">Нет атрибутов</div>;
  }

  const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');

  return (
    <>
      {attributeKeys.map((key) => (
        <div key={key} className="pb-3 border-b border-border last:border-0">
          <p className="text-xs font-semibold text-primary mb-1">
            {key}
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