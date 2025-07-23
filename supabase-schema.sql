-- Create the digests table
CREATE TABLE IF NOT EXISTS digests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript TEXT NOT NULL,
  summary TEXT NOT NULL,
  overview TEXT NOT NULL,
  key_decisions TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  public_id VARCHAR(10) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for public_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_digests_public_id ON digests(public_id);

-- Create index for created_at for sorting
CREATE INDEX IF NOT EXISTS idx_digests_created_at ON digests(created_at DESC);

-- Create function to generate unique public_id
CREATE OR REPLACE FUNCTION generate_public_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate public_id
CREATE OR REPLACE FUNCTION set_public_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.public_id := generate_public_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_public_id
BEFORE INSERT ON digests
FOR EACH ROW
EXECUTE FUNCTION set_public_id();