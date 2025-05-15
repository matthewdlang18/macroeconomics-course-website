-- Create a table for storing user stats for the Econ Words game
CREATE TABLE IF NOT EXISTS public.econ_terms_user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    streak INTEGER DEFAULT 0,
    high_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_econ_terms_user_stats_user_id ON public.econ_terms_user_stats(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.econ_terms_user_stats ENABLE ROW LEVEL SECURITY;

-- Allow users to view all user stats entries
CREATE POLICY "User stats are viewable by everyone" 
ON public.econ_terms_user_stats FOR SELECT USING (true);

-- Allow authenticated users to insert their own stats
CREATE POLICY "Users can insert their own stats" 
ON public.econ_terms_user_stats FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Allow users to update only their own stats
CREATE POLICY "Users can update their own stats" 
ON public.econ_terms_user_stats FOR UPDATE 
USING (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Allow users to delete only their own stats
CREATE POLICY "Users can delete their own stats" 
ON public.econ_terms_user_stats FOR DELETE 
USING (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.econ_terms_user_stats TO authenticated;
GRANT SELECT ON public.econ_terms_user_stats TO anon;

-- Create a function to create the table if it doesn't exist
CREATE OR REPLACE FUNCTION create_econ_terms_user_stats_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'econ_terms_user_stats'
    ) THEN
        -- Create the table
        CREATE TABLE public.econ_terms_user_stats (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES public.profiles(id),
            streak INTEGER DEFAULT 0,
            high_score INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add indexes
        CREATE INDEX idx_econ_terms_user_stats_user_id ON public.econ_terms_user_stats(user_id);
        
        -- Enable RLS
        ALTER TABLE public.econ_terms_user_stats ENABLE ROW LEVEL SECURITY;
        
        -- Add policies
        CREATE POLICY "User stats are viewable by everyone" 
        ON public.econ_terms_user_stats FOR SELECT USING (true);
        
        CREATE POLICY "Users can insert their own stats" 
        ON public.econ_terms_user_stats FOR INSERT 
        WITH CHECK (auth.uid()::text = user_id::text OR user_id IN (
            SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
        ));
        
        CREATE POLICY "Users can update their own stats" 
        ON public.econ_terms_user_stats FOR UPDATE 
        USING (auth.uid()::text = user_id::text OR user_id IN (
            SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
        ));
        
        CREATE POLICY "Users can delete their own stats" 
        ON public.econ_terms_user_stats FOR DELETE 
        USING (auth.uid()::text = user_id::text OR user_id IN (
            SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
        ));
        
        -- Grant access
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.econ_terms_user_stats TO authenticated;
        GRANT SELECT ON public.econ_terms_user_stats TO anon;
    END IF;
END;
$$;
