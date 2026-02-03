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
  await new Promise(resolve => setTimeout(resolve, 800));
  const hybridCanvas = await html2canvas(mapContainer, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 0,
    removeContainer: false
  });
  const hybridImage = getCanvasDataURL(hybridCanvas);

  mapInstance.setType('yandex#map');
  mapInstance.setZoom(originalZoom);
  await new Promise(resolve => setTimeout(resolve, 800));
  const schemeCanvas = await html2canvas(mapContainer, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 0,
    removeContainer: false
  });
  const schemeImage = getCanvasDataURL(schemeCanvas);

  mapInstance.setType(originalType);
  mapInstance.setCenter(originalCenter, originalZoom);

  return {
    hybrid: hybridImage,
    scheme: schemeImage
  };
}

function getCanvasDataURL(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.warn('toDataURL failed, using canvas as blob:', error);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    const newCtx = newCanvas.getContext('2d');
    if (!newCtx) throw new Error('Cannot get new canvas context');
    
    newCtx.drawImage(canvas, 0, 0);
    
    try {
      return newCanvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      newCtx.putImageData(imageData, 0, 0);
      return newCanvas.toDataURL('image/jpeg', 0.8);
    }
  }
}

export async function generatePropertyPDF(
  property: Property,
  mapScreenshots: MapScreenshot,
  logoUrl?: string,
  companyName?: string
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

  if (logoUrl) {
    try {
      const logoSize = 20;
      pdf.addImage(logoUrl, 'PNG', margin, yPosition, logoSize, logoSize);
      
      if (companyName) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(companyName, margin + logoSize + 5, yPosition + 7);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('Картографическая CRM', margin + logoSize + 5, yPosition + 13);
      }
      
      yPosition += logoSize + 10;
      
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
  }

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
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