import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import AttributesDisplay from '@/components/AttributesDisplay';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface Property {
  id: number;
  title: string;
  type: 'land' | 'commercial' | 'residential';
  price: number;
  area: number;
  location: string;
  coordinates: [number, number];
  segment: 'premium' | 'standard' | 'economy';
  status: 'available' | 'reserved' | 'sold';
  boundary?: Array<[number, number]>;
  attributes?: Record<string, any>;
}

interface PropertyAttributesPanelProps {
  property: Property;
  userRole: string;
  onClose: () => void;
  onAttributesUpdate: (updatedAttrs: Record<string, any>) => void;
  onZoomToProperty?: () => void;
  onGeneratePDF?: () => void;
  onReturnToOverview?: () => void;
}

const PropertyAttributesPanel = ({ property, userRole, onClose, onAttributesUpdate, onZoomToProperty, onGeneratePDF, onReturnToOverview }: PropertyAttributesPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePropertyDeleted = () => {
      onClose();
    };
    
    window.addEventListener('property-deleted', handlePropertyDeleted);
    return () => window.removeEventListener('property-deleted', handlePropertyDeleted);
  }, [onClose]);

  useEffect(() => {
    const dragHandle = dragHandleRef.current;
    if (!dragHandle) return;

    const handleTouchStart = (e: TouchEvent) => {
      setDragStartY(e.touches[0].clientY);
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - dragStartY;
      
      // Позволяем тянуть только вниз (закрытие) или вверх (расширение)
      if (isExpanded && diff > 0) {
        // Если панель развёрнута, разрешаем тянуть вниз
        setCurrentTranslate(Math.max(0, diff));
      } else if (!isExpanded && diff < 0) {
        // Если панель свёрнута, разрешаем тянуть вверх
        setCurrentTranslate(Math.min(0, diff));
      } else if (!isExpanded && diff > 0) {
        // Если свёрнута и тянем вниз = закрытие
        setCurrentTranslate(Math.max(0, diff));
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      const threshold = 80; // Порог для срабатывания жеста
      
      if (isExpanded) {
        // Если развёрнута
        if (currentTranslate > threshold) {
          // Тянули вниз достаточно сильно - сворачиваем
          setIsExpanded(false);
        } else if (currentTranslate > threshold * 2) {
          // Тянули вниз очень сильно - закрываем
          onClose();
        }
      } else {
        // Если свёрнута
        if (currentTranslate < -threshold) {
          // Тянули вверх - разворачиваем
          setIsExpanded(true);
        } else if (currentTranslate > threshold) {
          // Тянули вниз - закрываем
          onClose();
        }
      }
      
      setCurrentTranslate(0);
    };

    dragHandle.addEventListener('touchstart', handleTouchStart);
    dragHandle.addEventListener('touchmove', handleTouchMove);
    dragHandle.addEventListener('touchend', handleTouchEnd);

    return () => {
      dragHandle.removeEventListener('touchstart', handleTouchStart);
      dragHandle.removeEventListener('touchmove', handleTouchMove);
      dragHandle.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStartY, currentTranslate, isExpanded, onClose]);

  if (!property.attributes) return null;

  return (
    <>
      {/* Мобильная версия - снизу */}
      <Card 
        ref={panelRef}
        className={cn(
          "sm:hidden absolute bottom-0 left-0 right-0 shadow-2xl animate-slide-up overflow-hidden flex flex-col z-50 rounded-t-2xl rounded-b-none transition-all duration-300",
          isExpanded ? "h-[calc(100vh-120px)]" : "h-[55vh]"
        )}
        style={{
          transform: `translateY(${currentTranslate}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Drag handle */}
        <div 
          ref={dragHandleRef}
          className="flex justify-center py-3 border-b border-border cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>
        
        <CardHeader className="pb-3 border-b border-border flex-shrink-0 pt-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold">
                {property.title}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1"
              onClick={onClose}
            >
              <Icon name="X" size={18} />
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={onReturnToOverview || onClose}
              variant="outline"
              size="sm"
              className="h-8 px-2 gap-1.5 text-xs flex-1"
            >
              <Icon name="MapPin" size={14} />
              <span className="hidden xs:inline">К обзору</span>
            </Button>
            {onGeneratePDF && (
              <Button
                onClick={onGeneratePDF}
                size="sm"
                className="h-8 px-2 gap-1.5 text-xs bg-primary hover:bg-primary/90 flex-1"
              >
                <Icon name="FileText" size={14} />
                <span className="hidden xs:inline">PDF</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent 
          ref={contentRef}
          className="p-3 pb-6 overflow-y-auto flex-1 flex flex-col relative"
          onScroll={(e) => {
            const target = e.currentTarget;
            const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
            setShowScrollIndicator(!isAtBottom);
          }}
        >
          <AttributesDisplay 
            attributes={property.attributes}
            userRole={userRole}
            featureId={property.id}
            onAttributesUpdate={onAttributesUpdate}
          />
          <div className="h-16" />
          
          {/* Индикатор прокрутки */}
          {showScrollIndicator && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none flex items-end justify-center pb-3 animate-pulse">
              <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                <Icon name="ChevronDown" size={20} />
                <span className="text-xs">Прокрутите вниз</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Десктопная версия - справа */}
      <Card className="hidden sm:flex absolute top-0 right-0 h-full w-[450px] shadow-2xl animate-fade-in overflow-hidden flex-col z-50">
        <CardHeader className="pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold mb-3">
                {property.title}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1"
              onClick={onClose}
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between gap-2">
              <Button
                onClick={onReturnToOverview || onClose}
                variant="outline"
                size="sm"
                className="h-7 px-3 gap-1.5"
              >
                <Icon name="MapPin" size={14} />
                Вернуться к обзору
              </Button>
              {onGeneratePDF && (
                <Button
                  onClick={onGeneratePDF}
                  size="sm"
                  className="h-7 px-3 gap-1.5 bg-primary hover:bg-primary/90"
                >
                  <Icon name="FileText" size={14} />
                  Скачать PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto flex-1 flex flex-col">
          <AttributesDisplay 
            attributes={property.attributes}
            userRole={userRole}
            featureId={property.id}
            onAttributesUpdate={onAttributesUpdate}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default PropertyAttributesPanel;