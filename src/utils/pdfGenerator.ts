import jsPDF from 'jspdf';
import { Property } from '@/services/propertyService';
import { getPTSansFont } from './fonts/PTSans-Regular';

interface MapScreenshot {
  hybrid: string;
  scheme: string;
}

let fontLoaded = false;

async function loadRussianFont(pdf: jsPDF) {
  if (!fontLoaded) {
    const fontBase64 = await getPTSansFont();
    pdf.addFileToVFS('PTSans-Regular.ttf', fontBase64);
    pdf.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
    fontLoaded = true;
  }
  pdf.setFont('PTSans');
}

async function getStaticMapImage(
  coordinates: [number, number],
  layer: 'map' | 'sat',
  polygon?: Array<[number, number]>
): Promise<string> {
  const lon = coordinates[1];
  const lat = coordinates[0];
  const zoom = 15;
  const width = 600;
  const height = 450;

  let url = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=${zoom}&l=${layer}&size=${width},${height}`;

  if (polygon && polygon.length > 0) {
    const points = polygon.map(coord => `${coord[1]},${coord[0]}`).join(',');
    url += `&pl=c:ff6b35ff,f:ff6b3533,w:3,${points}`;
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch static map:', error);
    throw error;
  }
}

export async function captureMapScreenshots(
  mapInstance: any,
  property: Property
): Promise<MapScreenshot> {
  if (!property.coordinates) {
    throw new Error('Координаты объекта не найдены');
  }

  const [hybridImage, schemeImage] = await Promise.all([
    getStaticMapImage(property.coordinates, 'sat', property.boundary),
    getStaticMapImage(property.coordinates, 'map', property.boundary)
  ]);

  return {
    hybrid: hybridImage,
    scheme: schemeImage
  };
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

  await loadRussianFont(pdf);

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
        pdf.setTextColor(0, 0, 0);
        pdf.text(companyName, margin + logoSize + 5, yPosition + 7);
        
        pdf.setFontSize(9);
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
  pdf.setTextColor(0, 0, 0);
  pdf.text(property.title, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(property.location, margin, yPosition);
  yPosition += 12;

  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
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
  pdf.text('Обзорная карта (Схема)', margin, yPosition);
  yPosition += 7;

  pdf.addImage(mapScreenshots.scheme, 'JPEG', margin, yPosition, imageWidth, imageHeight);
  yPosition += imageHeight + 12;

  if (yPosition + 40 > pageHeight) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(16);
  pdf.text('Характеристики объекта', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);

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
  const labelColumnWidth = 60;
  
  attributes.forEach(attr => {
    const valueLines = pdf.splitTextToSize(attr.value, contentWidth - labelColumnWidth);
    const requiredHeight = lineHeight * valueLines.length;
    
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.text(`${attr.label}:`, margin, yPosition);
    pdf.text(valueLines, margin + labelColumnWidth, yPosition);
    
    yPosition += requiredHeight;
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
    offerType: 'Тип предложения',
    id: 'ID',
    ird: 'ИРД',
    oks: 'ОКС',
    date: 'Дата сдачи',
    prava: 'Права',
    ekspos: 'Экспозиция',
    region: 'Регион',
    pravoobl: 'Правообладатель',
    soinvest: 'Соинвестирование',
    uchastok: 'Участок',
    grad_param: 'Градостроительные параметры',
    type_pred: 'Тип предложения',
    status_publ: 'Статус публикации'
  };
  return names[key] || key;
}

function formatAttributeValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  if (Array.isArray(value)) return value.join(', ');
  const str = String(value);
  if (str.length > 100) {
    return str.substring(0, 100) + '...';
  }
  return str;
}