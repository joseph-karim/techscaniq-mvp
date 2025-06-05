import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

const supabase = createClient(supabaseUrl, supabaseKey)

// Get all edge functions from the filesystem
const functionsDir = './supabase/functions'
const edgeFunctions = fs.readdirSync(functionsDir)
  .filter(name => !name.startsWith('.') && !name.startsWith('_'))
  .map(name => {
    const functionPath = path.join(functionsDir, name)
    const stats = fs.statSync(functionPath)
    return {
      name,
      path: functionPath,
      isDirectory: stats.isDirectory()
    }
  })
  .filter(func => func.isDirectory)

console.log('Found edge functions:', edgeFunctions.map(f => f.name))

// Real prompts extracted from actual edge functions
const realPrompts = [
  {
    name: 'Website HTML Collection',
    description: 'Collects HTML content from company websites for analysis',
    prompt_text: 'Collect the HTML content from {{website_url}} and extract useful metadata including page title, description, and key content sections. Focus on gathering information that would be relevant for technical due diligence.',
    category: 'evidence_collection',
    function_name: 'html-collector',
    variables: ['website_url']
  },
  {
    name: 'Google Business Search',
    description: 'Searches Google for company business information',
    prompt_text: '{{company_name}} {{search_type}} information',
    category: 'evidence_collection', 
    function_name: 'google-search-collector',
    variables: ['company_name', 'search_type']
  },
  {
    name: 'Technology Stack Analysis',
    description: 'Analyzes website technology stack using Wappalyzer',
    prompt_text: 'Analyze the technology stack of {{website_url}} using Wappalyzer and retire.js to identify frameworks, libraries, and potential vulnerabilities.',
    category: 'evidence_collection',
    function_name: 'webtech-analyzer', 
    variables: ['website_url']
  },
  {
    name: 'Security Headers Assessment',
    description: 'Evaluates security headers and SSL configuration',
    prompt_text: 'Perform security analysis on {{website_url}} checking for proper security headers, SSL configuration, and common security vulnerabilities.',
    category: 'evidence_collection',
    function_name: 'security-scanner',
    variables: ['website_url']
  },
  {
    name: 'Performance Metrics Collection',
    description: 'Collects Lighthouse performance metrics',
    prompt_text: 'Run Lighthouse performance analysis on {{website_url}} using {{strategy}} strategy to gather Core Web Vitals and performance recommendations.',
    category: 'evidence_collection',
    function_name: 'performance-analyzer',
    variables: ['website_url', 'strategy']
  },
  {
    name: 'Deep Website Crawling',
    description: 'Performs deep crawling with Playwright for technical analysis',
    prompt_text: 'Use Playwright to deeply crawl {{website_url}} with depth {{depth}}, extracting scripts, APIs, and technical architecture information.',
    category: 'evidence_collection',
    function_name: 'playwright-crawler',
    variables: ['website_url', 'depth']
  },
  {
    name: 'Vulnerability Scanning',
    description: 'Performs vulnerability scanning with Nuclei',
    prompt_text: 'Execute Nuclei vulnerability scan on {{website_url}} with {{deep}} mode to identify security issues and potential attack vectors.',
    category: 'evidence_collection',
    function_name: 'nuclei-scanner',
    variables: ['website_url', 'deep']
  },
  {
    name: 'SSL Certificate Analysis',
    description: 'Analyzes SSL/TLS configuration and certificates',
    prompt_text: 'Perform comprehensive SSL/TLS analysis on {{hostname}} checking certificate validity, cipher suites, and security configuration.',
    category: 'evidence_collection',
    function_name: 'testssl-scanner',
    variables: ['hostname']
  },
  {
    name: 'Executive Report Generation',
    description: 'Generates comprehensive executive reports from evidence',
    prompt_text: 'Generate a comprehensive executive report for {{company_name}} based on collected evidence, focusing on {{investment_thesis}} and including technical health score, risk assessment, and strategic recommendations.',
    category: 'report_generation',
    function_name: 'generate-executive-report',
    variables: ['company_name', 'investment_thesis']
  },
  {
    name: 'Evidence Classification',
    description: 'Classifies collected evidence into categories',
    prompt_text: 'Classify the evidence item of type {{evidence_type}} with content "{{content_preview}}" into appropriate categories (technology, security, infrastructure, team, market, financial) with confidence scores.',
    category: 'classification',
    function_name: 'evidence-processor',
    variables: ['evidence_type', 'content_preview']
  }
]

// Enhanced scan configurations based on actual usage
const scanConfigurations = [
  {
    name: 'Quick Assessment',
    description: 'Fast basic assessment for initial screening (5-8 minutes)',
    depth: 'shallow',
    configuration: {
      phases: ['basic_content', 'business_info'],
      tools: ['html-collector', 'google-search-collector'],
      timeout_ms: 480000,
      evidence_types: ['website_content', 'business_overview'],
      max_concurrent: 2
    },
    is_default: false,
    is_active: true
  },
  {
    name: 'Standard Technical Scan',
    description: 'Comprehensive technical analysis with security (15-25 minutes)',
    depth: 'deep',
    configuration: {
      phases: ['basic_content', 'business_info', 'technical_analysis', 'security_analysis'],
      tools: [
        'html-collector', 
        'google-search-collector', 
        'playwright-crawler',
        'webtech-analyzer',
        'security-scanner',
        'testssl-scanner',
        'performance-analyzer'
      ],
      timeout_ms: 1500000,
      evidence_types: [
        'website_content',
        'business_overview', 
        'deep_crawl',
        'technology_stack',
        'security_analysis',
        'ssl_analysis',
        'performance_metrics'
      ],
      max_concurrent: 3
    },
    is_default: true,
    is_active: true
  },
  {
    name: 'Complete Due Diligence',
    description: 'Full analysis including market research and vulnerability scanning (30-45 minutes)',
    depth: 'comprehensive',
    configuration: {
      phases: [
        'basic_content', 
        'business_info', 
        'technical_analysis', 
        'security_analysis',
        'advanced_searches',
        'vulnerability_scanning'
      ],
      tools: [
        'html-collector',
        'google-search-collector', 
        'playwright-crawler',
        'webtech-analyzer',
        'security-scanner',
        'testssl-scanner',
        'performance-analyzer',
        'nuclei-scanner'
      ],
      timeout_ms: 2700000,
      evidence_types: [
        'website_content',
        'business_overview',
        'deep_crawl', 
        'technology_stack',
        'security_analysis',
        'ssl_analysis',
        'performance_metrics',
        'vulnerability_scan',
        'team_info',
        'market_analysis',
        'financial_info',
        'tech_deep_dive'
      ],
      max_concurrent: 4
    },
    is_default: false,
    is_active: true
  },
  {
    name: 'Security-Focused Assessment',
    description: 'Intensive security and compliance analysis (20-30 minutes)',
    depth: 'custom',
    configuration: {
      phases: ['basic_content', 'security_analysis', 'vulnerability_scanning'],
      tools: [
        'html-collector',
        'webtech-analyzer',
        'security-scanner', 
        'testssl-scanner',
        'nuclei-scanner'
      ],
      timeout_ms: 1800000,
      evidence_types: [
        'website_content',
        'technology_stack',
        'security_analysis',
        'ssl_analysis', 
        'vulnerability_scan'
      ],
      max_concurrent: 2
    },
    is_default: false,
    is_active: true
  }
]

// Mock edge function execution logs for demonstration
const mockExecutionLogs = [
  {
    function_name: 'evidence-collector-v7',
    status: 'completed',
    duration_ms: 45000,
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 minutes ago
  },
  {
    function_name: 'html-collector',
    status: 'completed', 
    duration_ms: 3200,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
  },
  {
    function_name: 'webtech-analyzer',
    status: 'completed',
    duration_ms: 8500,
    created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString() // 7 minutes ago
  },
  {
    function_name: 'security-scanner',
    status: 'failed',
    duration_ms: null,
    error_message: 'Timeout connecting to target server',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
  },
  {
    function_name: 'google-search-collector',
    status: 'completed',
    duration_ms: 2100,
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString() // 2 minutes ago
  },
  {
    function_name: 'performance-analyzer',
    status: 'completed',
    duration_ms: 12800,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString() // 8 minutes ago
  },
  {
    function_name: 'nuclei-scanner',
    status: 'completed',
    duration_ms: 25000,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString() // 20 minutes ago
  },
  {
    function_name: 'playwright-crawler',
    status: 'timeout',
    duration_ms: 30000,
    error_message: 'Function execution timed out after 30s',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString() // 12 minutes ago
  }
]

// Updated admin settings with more realistic values
const adminSettings = [
  {
    setting_key: 'evidence_collection_timeout',
    setting_value: { default: 30000, max: 60000, min: 10000 },
    category: 'timeouts',
    description: 'Timeout settings for evidence collection functions (in milliseconds)'
  },
  {
    setting_key: 'max_concurrent_scans',
    setting_value: { value: 5, max_per_user: 2 },
    category: 'capacity',
    description: 'Maximum number of concurrent scans allowed globally and per user'
  },
  {
    setting_key: 'ai_model_preferences',
    setting_value: {
      report_generation: 'claude-3-sonnet',
      evidence_analysis: 'gpt-4-turbo', 
      classification: 'claude-3-haiku',
      summarization: 'gpt-4o-mini'
    },
    category: 'ai_models',
    description: 'Preferred AI models for different tasks'
  },
  {
    setting_key: 'retry_configuration',
    setting_value: {
      max_retries: 3,
      retry_delay_ms: 5000,
      exponential_backoff: true
    },
    category: 'reliability',
    description: 'Retry configuration for failed function executions'
  },
  {
    setting_key: 'evidence_storage_limits',
    setting_value: {
      max_items_per_scan: 100,
      max_content_size_kb: 1024,
      retention_days: 90
    },
    category: 'storage',
    description: 'Limits and retention policy for evidence storage'
  }
]

async function seedDatabase() {
  console.log('Starting database seeding...')

  try {
    // Clear existing data
    console.log('Clearing existing configuration data...')
    await supabase.from('ai_prompts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('scan_configurations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('edge_function_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('admin_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert prompts
    console.log('Inserting AI prompts...')
    const { error: promptsError } = await supabase
      .from('ai_prompts')
      .insert(realPrompts.map(prompt => ({
        ...prompt,
        variables: JSON.stringify(prompt.variables)
      })))
    
    if (promptsError) {
      console.error('Error inserting prompts:', promptsError)
    } else {
      console.log(`✓ Inserted ${realPrompts.length} prompts`)
    }

    // Insert scan configurations
    console.log('Inserting scan configurations...')
    const { error: configsError } = await supabase
      .from('scan_configurations')
      .insert(scanConfigurations)
    
    if (configsError) {
      console.error('Error inserting scan configurations:', configsError)
    } else {
      console.log(`✓ Inserted ${scanConfigurations.length} scan configurations`)
    }

    // Insert mock execution logs
    console.log('Inserting mock execution logs...')
    const { error: logsError } = await supabase
      .from('edge_function_logs')
      .insert(mockExecutionLogs)
    
    if (logsError) {
      console.error('Error inserting logs:', logsError)
    } else {
      console.log(`✓ Inserted ${mockExecutionLogs.length} execution logs`)
    }

    // Insert admin settings
    console.log('Inserting admin settings...')
    const { error: settingsError } = await supabase
      .from('admin_settings')
      .insert(adminSettings)
    
    if (settingsError) {
      console.error('Error inserting settings:', settingsError)
    } else {
      console.log(`✓ Inserted ${adminSettings.length} admin settings`)
    }

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\nSummary:')
    console.log(`- ${realPrompts.length} AI prompts`)
    console.log(`- ${scanConfigurations.length} scan configurations`) 
    console.log(`- ${mockExecutionLogs.length} execution logs`)
    console.log(`- ${adminSettings.length} admin settings`)
    console.log(`- ${edgeFunctions.length} edge functions discovered`)

  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()