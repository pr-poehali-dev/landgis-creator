-- Добавляем условное отображение для lgota: показывать только если status_mpt = true
UPDATE t_p78972315_landgis_creator.attribute_config 
SET format_options = jsonb_build_object(
    'conditionalDisplay', jsonb_build_object(
        'dependsOn', 'status_mpt',
        'showWhen', 'true'
    )
),
    visible_in_table = true,
    updated_at = CURRENT_TIMESTAMP
WHERE attribute_key = 'lgota';
