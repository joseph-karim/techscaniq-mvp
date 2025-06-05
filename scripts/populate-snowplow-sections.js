#!/usr/bin/env node

/**
 * Populate Snowplow scan with proper sections data for testing
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateSnowplowSections() {
  console.log('📝 Populating Snowplow scan with sections data...')

  try {
    // Sample sections data based on what the review component expects
    const sections = [
      {
        id: 'architecture',
        title: 'Architecture & Infrastructure',
        aiContent: `Snowplow demonstrates a sophisticated data processing architecture built on modern cloud-native principles. Their real-time data pipeline leverages:

1. **Event Collection Layer**: Multi-cloud JavaScript trackers with strong data validation
2. **Stream Processing**: Real-time enrichment and validation using Apache Kafka and custom Scala applications
3. **Storage Architecture**: Flexible data warehouse integration supporting Snowflake, BigQuery, and Redshift
4. **API Design**: Well-documented REST APIs with comprehensive schemas

Key Architectural Strengths:
- Distributed, fault-tolerant data pipeline design
- Strong data quality enforcement with automated validation
- Multi-cloud deployment capability (AWS, GCP, Azure)
- Open-source core with enterprise features available

Areas for Consideration:
- Complex setup and configuration requirements
- Significant infrastructure expertise needed for optimization
- Resource-intensive for small-scale implementations`,
        reviewerNotes: '',
        status: 'pending'
      },
      {
        id: 'code-quality',
        title: 'Code Quality & Technology Stack',
        aiContent: `Snowplow's technology stack reflects strong engineering practices with a focus on functional programming and type safety:

**Core Technologies:**
- **Scala**: Primary backend language for stream processing
- **JavaScript/TypeScript**: Client-side tracking libraries
- **Terraform**: Infrastructure as Code for deployment
- **Docker**: Containerized deployments
- **Apache Kafka**: Real-time stream processing

**Code Quality Indicators:**
- Extensive open-source contributions on GitHub
- Comprehensive unit and integration test coverage
- Strong documentation and API specifications
- Active community contributions and maintenance

**Development Practices:**
- Immutable data structures and functional programming patterns
- Strong type safety reducing runtime errors
- Comprehensive error handling and logging
- Regular security updates and vulnerability management

**Technical Debt Assessment:**
- Well-maintained codebase with regular refactoring
- Good separation of concerns between components
- Some legacy components requiring modernization`,
        reviewerNotes: '',
        status: 'pending'
      },
      {
        id: 'security',
        title: 'Security Posture',
        aiContent: `Snowplow demonstrates strong security practices with enterprise-grade data protection:

**Data Protection:**
- End-to-end encryption for data in transit and at rest
- GDPR and CCPA compliance features built-in
- PII pseudonymization and anonymization capabilities
- Configurable data retention policies

**Access Control:**
- Role-based access control (RBAC) for data access
- API authentication using multiple methods
- Audit logging for data access and modifications
- Integration with enterprise identity providers

**Infrastructure Security:**
- Regular security audits and penetration testing
- SOC 2 Type II compliance for enterprise features
- Secure deployment practices with least privilege
- Automated vulnerability scanning in CI/CD pipeline

**Areas for Enhancement:**
- Some open-source components require additional hardening
- Complex permission model may lead to misconfigurations
- Third-party integrations require careful security review`,
        reviewerNotes: '',
        status: 'pending'
      },
      {
        id: 'team',
        title: 'Team & Culture',
        aiContent: `Snowplow exhibits a strong engineering culture with emphasis on data quality and open-source principles:

**Leadership Team:**
- Alex Dean (Co-founder & CEO): Strong technical background in data engineering
- Yali Sassoon (Co-founder): Data analytics and product expertise
- Engineering leadership with deep domain knowledge

**Technical Team:**
- 50+ engineering professionals globally
- Strong functional programming and data engineering expertise
- Active open-source community contributors
- Remote-first culture with global talent acquisition

**Company Culture:**
- Data-driven decision making throughout organization
- Strong commitment to open-source community
- Emphasis on technical excellence and innovation
- Transparent communication and documentation practices

**Team Strengths:**
- Deep expertise in data engineering and analytics
- Strong product vision aligned with market needs
- Collaborative approach to problem-solving
- Continuous learning and technology adoption`,
        reviewerNotes: '',
        status: 'pending'
      }
    ]

    const risks = [
      {
        id: 1,
        title: 'Technical Complexity',
        description: 'High learning curve and operational complexity may limit market adoption',
        severity: 'medium',
        evidence: 'Based on community feedback and documentation complexity',
        section: 'architecture'
      },
      {
        id: 2,
        title: 'Market Competition',
        description: 'Intense competition from cloud-native analytics platforms',
        severity: 'high',
        evidence: 'Growth of Google Analytics 4, Adobe Analytics, and Segment',
        section: 'market'
      },
      {
        id: 3,
        title: 'Resource Requirements',
        description: 'Significant infrastructure and expertise requirements for optimal deployment',
        severity: 'medium',
        evidence: 'Based on typical customer implementation timelines',
        section: 'architecture'
      }
    ]

    // Update the scan with sections and risks data
    const { error: updateError } = await supabase
      .from('scan_requests')
      .update({ 
        sections: sections,
        risks: risks,
        status: 'awaiting_review'
      })
      .eq('id', '2436895f-727d-4a17-acc6-ef09a1de628a')

    if (updateError) {
      console.error('❌ Error updating scan:', updateError)
    } else {
      console.log('✅ Successfully populated Snowplow scan with sections and risks')
      console.log(`   Added ${sections.length} sections`)
      console.log(`   Added ${risks.length} risks`)
      console.log('   Status: awaiting_review')
      
      sections.forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.title}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

populateSnowplowSections()