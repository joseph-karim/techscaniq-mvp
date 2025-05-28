-- Grant admin read access to all scan_requests
CREATE POLICY "Admins can view all scan requests v2" 
ON public.scan_requests FOR SELECT 
TO authenticated 
USING ((auth.jwt() ->> 'user_roles')::jsonb ? 'admin');

-- Grant admin read access to all reports
CREATE POLICY "Admins can view all reports v2"
ON public.reports FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'user_roles')::jsonb ? 'admin');

-- Ensure service_role can still do everything
-- (Policies for service_role are usually broad or bypass RLS, but being explicit can help)
-- Note: Supabase typically allows service_role to bypass RLS by default.
-- However, if RLS is enabled and no permissive policy for service_role exists,
-- it might be restricted. These are more for completeness if strict RLS is somehow enforced on service_role.

-- DROP POLICY IF EXISTS "Service role can manage scan requests" ON public.scan_requests;
-- CREATE POLICY "Service role can manage scan requests"
-- ON public.scan_requests FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- DROP POLICY IF EXISTS "Service role can manage reports" ON public.reports;
-- CREATE POLICY "Service role can manage reports v2"
-- ON public.reports FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true); 