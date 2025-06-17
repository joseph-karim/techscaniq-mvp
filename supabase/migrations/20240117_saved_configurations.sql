-- Create table for saved investment thesis configurations
CREATE TABLE IF NOT EXISTS saved_investment_thesis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thesis_type VARCHAR(100) NOT NULL,
    custom_thesis_name VARCHAR(255),
    criteria JSONB NOT NULL DEFAULT '[]',
    focus_areas TEXT[] DEFAULT '{}',
    time_horizon VARCHAR(50),
    target_multiple VARCHAR(50),
    notes TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for saved vendor/sales profiles
CREATE TABLE IF NOT EXISTS saved_vendor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    offering VARCHAR(500) NOT NULL,
    ideal_customer_profile JSONB NOT NULL DEFAULT '{}',
    use_cases TEXT[] DEFAULT '{}',
    budget_range JSONB,
    decision_criteria TEXT[] DEFAULT '{}',
    competitive_alternatives TEXT[] DEFAULT '{}',
    evaluation_timeline VARCHAR(100),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_saved_investment_thesis_user_id ON saved_investment_thesis(user_id);
CREATE INDEX idx_saved_vendor_profiles_user_id ON saved_vendor_profiles(user_id);

-- Add RLS policies
ALTER TABLE saved_investment_thesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own saved configurations
CREATE POLICY "Users can view own investment thesis" ON saved_investment_thesis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment thesis" ON saved_investment_thesis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment thesis" ON saved_investment_thesis
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment thesis" ON saved_investment_thesis
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own vendor profiles" ON saved_vendor_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendor profiles" ON saved_vendor_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendor profiles" ON saved_vendor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendor profiles" ON saved_vendor_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Function to ensure only one default per user
CREATE OR REPLACE FUNCTION ensure_single_default_investment_thesis()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE saved_investment_thesis 
        SET is_default = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_single_default_vendor_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE saved_vendor_profiles 
        SET is_default = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER ensure_single_default_investment_thesis_trigger
    BEFORE INSERT OR UPDATE ON saved_investment_thesis
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_investment_thesis();

CREATE TRIGGER ensure_single_default_vendor_profile_trigger
    BEFORE INSERT OR UPDATE ON saved_vendor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_vendor_profile();

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_saved_investment_thesis_updated_at
    BEFORE UPDATE ON saved_investment_thesis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_vendor_profiles_updated_at
    BEFORE UPDATE ON saved_vendor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();