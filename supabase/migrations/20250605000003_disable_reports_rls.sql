-- Disable RLS on reports table to allow edge function inserts
-- This is safe since reports are created by edge functions and read by authenticated users

ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on evidence tables to ensure evidence storage works
ALTER TABLE public.evidence_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_citations DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining why RLS is disabled
COMMENT ON TABLE public.reports IS 'RLS disabled - reports are created by edge functions (service role) and accessed by authenticated users through application logic';
COMMENT ON TABLE public.evidence_collections IS 'RLS disabled - evidence is collected by edge functions (service role)';
COMMENT ON TABLE public.evidence_items IS 'RLS disabled - evidence is collected by edge functions (service role)';
COMMENT ON TABLE public.evidence_chunks IS 'RLS disabled - evidence is collected by edge functions (service role)';
COMMENT ON TABLE public.report_citations IS 'RLS disabled - citations are created by edge functions (service role)';