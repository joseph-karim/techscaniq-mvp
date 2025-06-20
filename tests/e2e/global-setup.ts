import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

async function globalSetup(config: FullConfig) {
  console.log('Running global test setup...');
  
  // Initialize test database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Clean up existing test data
    await cleanupTestData(supabase);
    
    // Seed test data
    await seedTestData(supabase);
    
    // Create test users
    await createTestUsers(supabase);
    
    console.log('Global test setup completed successfully');
  } catch (error) {
    console.error('Global test setup failed:', error);
    throw error;
  }
}

async function cleanupTestData(supabase: any) {
  console.log('Cleaning up test data...');
  
  // Delete test data in correct order to respect foreign keys
  const tables = [
    'report_sections',
    'reports', 
    'scan_results',
    'scans',
    'api_keys',
    'user_profiles'
  ];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Delete data older than 7 days
    
    if (error) {
      console.warn(`Failed to clean ${table}:`, error.message);
    }
  }
}

async function seedTestData(supabase: any) {
  console.log('Seeding test data...');
  
  // Create test organizations
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .upsert([
      {
        id: 'test-org-1',
        name: 'Test Organization 1',
        slug: 'test-org-1'
      },
      {
        id: 'test-org-2', 
        name: 'Test Organization 2',
        slug: 'test-org-2'
      }
    ])
    .select();
  
  if (orgError) {
    console.error('Failed to create test organizations:', orgError);
  }
  
  // Create test reports for visual testing
  const testReports = [
    {
      id: 'visual-test-report',
      title: 'Visual Test Report',
      url: 'https://visual-test.com',
      status: 'completed',
      organization_id: 'test-org-1',
      technologies: ['React', 'Node.js', 'PostgreSQL'],
      security_score: 85,
      performance_score: 90,
      created_at: new Date().toISOString()
    },
    {
      id: 'empty-report',
      title: 'Empty Report',
      url: 'https://empty-test.com',
      status: 'completed',
      organization_id: 'test-org-1',
      technologies: [],
      created_at: new Date().toISOString()
    },
    {
      id: 'loading-report',
      title: 'Loading Report',
      url: 'https://loading-test.com',
      status: 'processing',
      organization_id: 'test-org-1',
      created_at: new Date().toISOString()
    },
    {
      id: 'error-report',
      title: 'Error Report',
      url: 'https://error-test.com',
      status: 'failed',
      error_message: 'Test error for visual testing',
      organization_id: 'test-org-1',
      created_at: new Date().toISOString()
    }
  ];
  
  const { error: reportError } = await supabase
    .from('reports')
    .upsert(testReports);
  
  if (reportError) {
    console.error('Failed to create test reports:', reportError);
  }
  
  // Create test report sections
  const sections = [
    {
      report_id: 'visual-test-report',
      type: 'technology',
      title: 'Technology Stack',
      content: JSON.stringify({
        technologies: [
          { name: 'React', version: '18.2.0', confidence: 0.95 },
          { name: 'Node.js', version: '18.x', confidence: 0.90 },
          { name: 'PostgreSQL', version: '14', confidence: 0.85 }
        ]
      })
    },
    {
      report_id: 'visual-test-report',
      type: 'security',
      title: 'Security Analysis',
      content: JSON.stringify({
        score: 85,
        vulnerabilities: [
          { type: 'XSS', severity: 'medium', count: 2 },
          { type: 'CSRF', severity: 'low', count: 1 }
        ]
      })
    },
    {
      report_id: 'visual-test-report',
      type: 'performance',
      title: 'Performance Metrics',
      content: JSON.stringify({
        score: 90,
        metrics: {
          FCP: 1200,
          LCP: 2100,
          CLS: 0.05,
          TBT: 200
        }
      })
    }
  ];
  
  const { error: sectionError } = await supabase
    .from('report_sections')
    .upsert(sections);
  
  if (sectionError) {
    console.error('Failed to create report sections:', sectionError);
  }
}

async function createTestUsers(supabase: any) {
  console.log('Creating test users...');
  
  const testUsers = [
    {
      email: 'test@example.com',
      password: 'password123',
      user_metadata: {
        name: 'Test User',
        role: 'user'
      }
    },
    {
      email: 'admin@example.com',
      password: 'admin123',
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    }
  ];
  
  for (const user of testUsers) {
    const { error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.user_metadata
    });
    
    if (error && !error.message.includes('already registered')) {
      console.error(`Failed to create user ${user.email}:`, error);
    }
  }
}

export default globalSetup;