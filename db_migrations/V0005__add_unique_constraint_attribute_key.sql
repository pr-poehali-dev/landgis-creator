-- Add unique constraint to attribute_key in attribute_config table
ALTER TABLE t_p78972315_landgis_creator.attribute_config 
ADD CONSTRAINT attribute_config_attribute_key_unique UNIQUE (attribute_key);
