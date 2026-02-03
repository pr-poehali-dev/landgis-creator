import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Property } from '@/services/propertyService';

interface MapScreenshot {
  hybrid: string;
  scheme: string;
}

export async function captureMapScreenshots(
  mapInstance: any,
  property: Property
): Promise<MapScreenshot> {
  const mapContainer = document.querySelector('.ymaps-2-1-79-map') as HTMLElement;
  
  if (!mapContainer || !mapInstance) {
    throw new Error('Карта не найдена');
  }

  const originalType = mapInstance.getType();
  const originalZoom = mapInstance.getZoom();
  const originalCenter = mapInstance.getCenter();

  if (property.coordinates) {
    mapInstance.setCenter(property.coordinates, 15);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  mapInstance.setType('yandex#hybrid');
  await new Promise(resolve => setTimeout(resolve, 300));
  const hybridCanvas = await html2canvas(mapContainer, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  });
  const hybridImage = hybridCanvas.toDataURL('image/jpeg', 0.8);

  mapInstance.setType('yandex#map');
  mapInstance.setZoom(originalZoom);
  await new Promise(resolve => setTimeout(resolve, 300));
  const schemeCanvas = await html2canvas(mapContainer, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  });
  const schemeImage = schemeCanvas.toDataURL('image/jpeg', 0.8);

  mapInstance.setType(originalType);
  mapInstance.setCenter(originalCenter, originalZoom);

  return {
    hybrid: hybridImage,
    scheme: schemeImage
  };
}

export async function generatePropertyPDF(
  property: Property,
  mapScreenshots: MapScreenshot
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let yPosition = margin;

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(property.title, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(property.location, margin, yPosition);
  yPosition += 12;

  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Детальный вид (Гибрид)', margin, yPosition);
  yPosition += 7;

  const imageWidth = contentWidth;
  const imageHeight = (imageWidth * 3) / 4;
  
  pdf.addImage(mapScreenshots.hybrid, 'JPEG', margin, yPosition, imageWidth, imageHeight);
  yPosition += imageHeight + 10;

  if (yPosition + 80 > pageHeight) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Обзорная карта (Схема)', margin, yPosition);
  yPosition += 7;

  pdf.addImage(mapScreenshots.scheme, 'JPEG', margin, yPosition, imageWidth, imageHeight);
  yPosition += imageHeight + 12;

  if (yPosition + 40 > pageHeight) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Характеристики объекта', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const attributes = [
    { label: 'Тип', value: getTypeLabel(property.type) },
    { label: 'Статус', value: property.status },
    { label: 'Площадь', value: property.area ? `${property.area} га` : '-' },
    { label: 'Цена', value: property.price ? `${property.price.toLocaleString('ru-RU')} ₽` : '-' }
  ];

  if (property.attributes) {
    Object.entries(property.attributes).forEach(([key, value]) => {
      const label = formatAttributeName(key);
      const valueStr = formatAttributeValue(value);
      if (valueStr) {
        attributes.push({ label, value: valueStr });
      }
    });
  }

  const lineHeight = 7;
  attributes.forEach(attr => {
    if (yPosition + lineHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${attr.label}:`, margin, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    const labelWidth = pdf.getTextWidth(`${attr.label}: `);
    pdf.text(attr.value, margin + labelWidth, yPosition);
    
    yPosition += lineHeight;
  });

  const fileName = `${property.title.replace(/[^a-zа-яё0-9]/gi, '_')}_teaser.pdf`;
  pdf.save(fileName);
}

function getTypeLabel(type: string): string {
  const types: Record<string, string> = {
    land: 'Земля',
    commercial: 'Коммерческая',
    residential: 'Жилая'
  };
  return types[type] || type;
}

function formatAttributeName(key: string): string {
  const names: Record<string, string> = {
    segment: 'Сегмент',
    developer: 'Застройщик',
    completionDate: 'Дата сдачи',
    hasIRD: 'ИРД',
    hasOKS: 'ОКС',
    constructionStatus: 'Градостроительный статус',
    broker: 'Уполномоченный брокер',
    coInvestmentPossibility: 'Возможность соинвеста',
    offerType: 'Тип предложения'
  };
  return names[key] || key;
}

function formatAttributeValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
