-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN 
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user'; 
    END IF; 
END $$;
