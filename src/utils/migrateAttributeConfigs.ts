/**
 * Одноразовая миграция настроек атрибутов из локального ключа в глобальный
 * Запускается один раз при загрузке приложения
 */
export const migrateAttributeConfigsToGlobal = () => {
  const OLD_KEY = 'attributeConfigs';
  const NEW_KEY = 'attributeConfigs_global_v1';
  const MIGRATION_FLAG = 'attributeConfigs_migrated_v1';
  
  // Если миграция уже была выполнена - пропускаем
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return;
  }
  
  // Проверяем, есть ли данные в новом ключе
  const newData = localStorage.getItem(NEW_KEY);
  if (newData) {
    // Если в новом ключе уже есть данные - ставим флаг и выходим
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return;
  }
  
  // Читаем из старого ключа
  const oldData = localStorage.getItem(OLD_KEY);
  if (!oldData) {
    // Если нет старых данных - просто ставим флаг
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return;
  }
  
  try {
    // Копируем данные в новый ключ
    localStorage.setItem(NEW_KEY, oldData);
    localStorage.setItem(MIGRATION_FLAG, 'true');
    
    console.log('✅ Настройки атрибутов перенесены в глобальный ключ');
  } catch (error) {
    console.error('❌ Ошибка миграции настроек атрибутов:', error);
  }
};

/**
 * Принудительный сброс настроек - для случаев когда у пользователя остались старые данные
 * ВРЕМЕННАЯ ФУНКЦИЯ для отладки
 */
export const forceResetAttributeConfigs = () => {
  const OLD_KEY = 'attributeConfigs';
  const NEW_KEY = 'attributeConfigs_global_v1';
  const MIGRATION_FLAG = 'attributeConfigs_migrated_v1';
  
  // Удаляем все старые ключи
  localStorage.removeItem(OLD_KEY);
  localStorage.removeItem(NEW_KEY);
  localStorage.removeItem(MIGRATION_FLAG);
  
  console.log('🔄 Настройки атрибутов сброшены. Обновите страницу.');
  alert('Настройки сброшены. Сейчас страница перезагрузится.');
  window.location.reload();
};