-- Удаляем начальные и конечные пробелы из названий объектов
UPDATE properties 
SET title = TRIM(title) 
WHERE title != TRIM(title);
