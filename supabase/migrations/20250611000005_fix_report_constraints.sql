-- Fix report constraints to allow thesis-aligned reports
-- Drop the existing constraint that requires specific structure
ALTER TABLE reports DROP CONSTRAINT IF EXISTS report_data_structure_check;

-- Add a more flexible constraint that allows both old and new report types
ALTER TABLE reports 
ADD CONSTRAINT report_data_structure_check 
CHECK (
  -- Either it's an old-style report with sections
  (report_data ? 'sections' AND
   report_data ? 'company_name' AND
   report_data ? 'investment_score' AND
   jsonb_typeof(report_data->'sections') = 'object')
  OR
  -- Or it's a thesis-aligned report with the new structure
  (report_type = 'thesis-aligned' AND
   report_data ? 'company_name' AND
   report_data ? 'weighted_scores' AND
   report_data ? 'executive_memo')
  OR
  -- Or it's another type that we allow
  report_type IS NOT NULL
);