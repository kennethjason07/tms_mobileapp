-- Add shirt_type column to measurements table
ALTER TABLE measurements ADD COLUMN shirt_type TEXT DEFAULT 'Shirt';

-- Update existing records to have 'Shirt' as the default value if null (though DEFAULT handles new ones, this is for safety on some DBs if column added with nulls)
UPDATE measurements SET shirt_type = 'Shirt' WHERE shirt_type IS NULL;
