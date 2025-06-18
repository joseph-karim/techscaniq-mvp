import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xngbtpbtivygkxnsexjg.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createFidelityScan() {
  console.log('Creating sales intelligence scan for Fidelity Canada...')

  const scanData = {
    company_name: 'Fidelity Canada',
    website_url: 'https://www.fidelity.ca',
    company_description: 'Fidelity Investments Canada ULC is one of the top investment management firms in Canada, offering a comprehensive range of mutual funds, ETFs, and investment solutions to Canadian investors.',
    report_type: 'sales-intelligence',
    status: 'pending',
    requestor_name: 'Admin User - Interad',
    organization_name: 'Interad',
    metadata: {
      report_type: 'sales-intelligence',
      sales_context: {
        company: 'Fidelity Canada',
        offering: 'Full-service digital agency providing end-to-end web and mobile solutions including custom development, CMS/e-commerce (Shopify Partner, WordPress expert), UX/UI design, QA, accessibility compliance (WCAG/AODA certified), and ongoing support',
        idealCustomerProfile: {
          industry: 'Financial Services',
          companySize: 'Large Enterprise (1000+ employees)',
          geography: 'Canada (Toronto/Ontario region)'
        },
        useCases: [
          'Develop secure online financial tools and calculators (mortgage, investment, retirement planning)',
          'Build compliant online account application forms with identity verification',
          'Create mobile apps for customer engagement (iOS/Android)',
          'Implement accessibility compliance for AODA requirements',
          'Modernize legacy web interfaces with responsive UX/UI design',
          'Integrate web platforms with backend financial systems',
          'Provide ongoing maintenance and security updates'
        ],
        budgetRange: {
          min: 250,
          max: 2000,
          currency: 'USD'
        },
        evaluationTimeline: 'Q1-Q2 2025',
        competitiveAlternatives: ['Accenture Interactive', 'Deloitte Digital', 'IBM iX', 'Publicis Sapient'],
        decisionCriteria: [
          'Deep expertise in financial services sector',
          'Strong security and compliance track record',
          'WCAG/AODA accessibility certification',
          'Local Toronto presence for close collaboration',
          'Experience with enterprise stakeholder management',
          'Proven ability to integrate with legacy systems'
        ],
        valueProposition: 'Interad brings 30 years of financial services expertise with proven success at major Canadian banks (including Big Five), specialized financial tool development (hundreds delivered), strong security/compliance understanding, and local Toronto presence for hands-on partnership.',
        differentiators: [
          'Decades of experience with Canadian financial institutions including Big Five banks',
          'Developed hundreds of financial calculators and tools',
          'AODA-certified team ensuring full accessibility compliance',
          '95% local Toronto team enabling close collaboration',
          'Experience navigating complex corporate approval processes',
          'Emerging capabilities in AEO/GEO for AI-driven search optimization'
        ]
      }
    },
    sections: [],
    risks: []
  }

  try {
    // Insert the scan request
    const { data, error } = await supabase
      .from('scan_requests')
      .insert(scanData)
      .select()
      .single()

    if (error) {
      console.error('Error creating scan:', error)
      return
    }

    console.log('✅ Scan created successfully!')
    console.log('Scan ID:', data.id)
    console.log('Company:', data.company_name)
    console.log('Report Type:', data.report_type)
    console.log('Status:', data.status)
    console.log('\n📊 You can view the scan at:')
    console.log(`http://localhost:5173/admin/scans/${data.id}`)
    
    // Trigger background processing via the API
    console.log('\n🚀 Triggering background research...')
    
    try {
      const response = await fetch('http://localhost:3001/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: data.company_name,
          website_url: data.website_url,
          company_description: data.company_description,
          report_type: data.report_type,
          metadata: data.metadata,
          requestor_name: data.requestor_name,
          organization_name: data.organization_name,
        }),
      })
      
      if (!response.ok) {
        console.error('⚠️ Background processing initiation failed')
      } else {
        console.log('✅ Background processing initiated successfully')
      }
    } catch (apiError) {
      console.error('⚠️ Could not reach API server:', apiError.message)
      console.log('Please ensure the API server is running (npm run server)')
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Run the function
createFidelityScan()