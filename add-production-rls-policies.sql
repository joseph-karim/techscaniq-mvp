-- Add RLS policies for demo access to production
CREATE POLICY IF NOT EXISTS "Demo access to ai_workflow_runs" ON ai_workflow_runs FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to ai_workflow_stages" ON ai_workflow_stages FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to tool_executions" ON tool_executions FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to prompt_executions" ON prompt_executions FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to reports" ON reports FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to report_citations" ON report_citations FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to evidence_items" ON evidence_items FOR SELECT TO anon USING (true);

-- Also add INSERT policies for creating demo data
CREATE POLICY IF NOT EXISTS "Demo insert ai_workflow_runs" ON ai_workflow_runs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Demo insert ai_workflow_stages" ON ai_workflow_stages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Demo insert tool_executions" ON tool_executions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Demo insert prompt_executions" ON prompt_executions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Demo insert reports" ON reports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Demo insert report_citations" ON report_citations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Demo insert evidence_items" ON evidence_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Demo insert evidence_collections" ON evidence_collections FOR INSERT TO anon WITH CHECK (true);