-- Add RLS policies for demo access
DO $$
BEGIN
    -- ai_workflow_runs policies
    DROP POLICY IF EXISTS "Demo access ai_workflow_runs" ON ai_workflow_runs;
    DROP POLICY IF EXISTS "Demo insert ai_workflow_runs" ON ai_workflow_runs;
    
    CREATE POLICY "Demo access ai_workflow_runs" ON ai_workflow_runs FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert ai_workflow_runs" ON ai_workflow_runs FOR INSERT TO anon WITH CHECK (true);
    
    -- ai_workflow_stages policies
    DROP POLICY IF EXISTS "Demo access ai_workflow_stages" ON ai_workflow_stages;
    DROP POLICY IF EXISTS "Demo insert ai_workflow_stages" ON ai_workflow_stages;
    
    CREATE POLICY "Demo access ai_workflow_stages" ON ai_workflow_stages FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert ai_workflow_stages" ON ai_workflow_stages FOR INSERT TO anon WITH CHECK (true);
    
    -- tool_executions policies
    DROP POLICY IF EXISTS "Demo access tool_executions" ON tool_executions;
    DROP POLICY IF EXISTS "Demo insert tool_executions" ON tool_executions;
    
    CREATE POLICY "Demo access tool_executions" ON tool_executions FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert tool_executions" ON tool_executions FOR INSERT TO anon WITH CHECK (true);
    
    -- prompt_executions policies
    DROP POLICY IF EXISTS "Demo access prompt_executions" ON prompt_executions;
    DROP POLICY IF EXISTS "Demo insert prompt_executions" ON prompt_executions;
    
    CREATE POLICY "Demo access prompt_executions" ON prompt_executions FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert prompt_executions" ON prompt_executions FOR INSERT TO anon WITH CHECK (true);
    
    -- reports policies
    DROP POLICY IF EXISTS "Demo access reports" ON reports;
    DROP POLICY IF EXISTS "Demo insert reports" ON reports;
    
    CREATE POLICY "Demo access reports" ON reports FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert reports" ON reports FOR INSERT TO anon WITH CHECK (true);
    
    -- report_citations policies
    DROP POLICY IF EXISTS "Demo access report_citations" ON report_citations;
    DROP POLICY IF EXISTS "Demo insert report_citations" ON report_citations;
    
    CREATE POLICY "Demo access report_citations" ON report_citations FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert report_citations" ON report_citations FOR INSERT TO anon WITH CHECK (true);
    
    -- evidence_items policies
    DROP POLICY IF EXISTS "Demo access evidence_items" ON evidence_items;
    DROP POLICY IF EXISTS "Demo insert evidence_items" ON evidence_items;
    
    CREATE POLICY "Demo access evidence_items" ON evidence_items FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert evidence_items" ON evidence_items FOR INSERT TO anon WITH CHECK (true);
    
    -- evidence_collections policies
    DROP POLICY IF EXISTS "Demo access evidence_collections" ON evidence_collections;
    DROP POLICY IF EXISTS "Demo insert evidence_collections" ON evidence_collections;
    
    CREATE POLICY "Demo access evidence_collections" ON evidence_collections FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert evidence_collections" ON evidence_collections FOR INSERT TO anon WITH CHECK (true);
    
    -- scan_requests policies
    DROP POLICY IF EXISTS "Demo access scan_requests" ON scan_requests;
    DROP POLICY IF EXISTS "Demo insert scan_requests" ON scan_requests;
    DROP POLICY IF EXISTS "Demo update scan_requests" ON scan_requests;
    
    CREATE POLICY "Demo access scan_requests" ON scan_requests FOR SELECT TO anon USING (true);
    CREATE POLICY "Demo insert scan_requests" ON scan_requests FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "Demo update scan_requests" ON scan_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
    
END$$;