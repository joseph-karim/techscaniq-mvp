# Admin Scan Feature Test Plan

## Summary
The admin-initiated scan feature has been successfully implemented with the following components:

### 1. Frontend Pages
- **Admin Scans List** (`/admin/scans`) - View all admin-initiated scans
- **New Admin Scan** (`/admin/scans/new`) - Create new scans with flexible context
- **Scan Details** (`/admin/scans/:id`) - View detailed scan information

### 2. Key Features Implemented

#### Admin Scan Request Form
- Company information (name, website, description, industry)
- Report type selection (PE Due Diligence or Sales Intelligence)
- Dynamic context forms based on report type
- Priority settings (low/medium/high/urgent)
- Direct database insertion with admin metadata

#### PE Due Diligence Context
- Investment thesis description
- PE Partner (optional)
- Investment amount
- Target hold period

#### Sales Intelligence Context
- Product/service offering
- Use cases
- Ideal customer profile (industry, size, geography)
- Budget range
- Evaluation timeline

#### Admin Scans Management
- Real-time status updates via Supabase subscriptions
- Search and filter capabilities
- Status badges and priority indicators
- Quick actions (view details, view report, retry)
- Job processing status with progress tracking

### 3. Backend Integration
- Admin authentication middleware
- Updated scan routes to handle admin-initiated scans
- Support for processing existing scans vs creating new ones

## Manual Testing Steps

### Prerequisites
1. Ensure you have admin access in the application
2. The development server should be running (`npm run dev`)

### Test Flow

1. **Navigate to Admin Scans**
   - Log in as an admin user
   - Look for "Admin Scans" in the admin section of the sidebar
   - Click to view the admin scans list

2. **Create a New Admin Scan**
   - Click the "New Scan" button
   - Fill in the form:
     - Company Name: "Example Corp"
     - Website: "https://example.com"
     - Description: "Test company for admin scan"
     - Industry: "Technology"
     - Report Type: Select either PE or Sales Intelligence
     - Fill in the context based on report type
     - Set Priority: Medium
   - Submit the form

3. **View Scan Details**
   - After creation, you should see the scan in the list
   - Click "View Details" to see comprehensive information
   - Check the three tabs: Context, Jobs, Metadata

4. **Monitor Progress**
   - The scan status should update in real-time
   - Watch for status changes: pending → processing → completed/failed

## Database Schema Requirements

The implementation expects the following in your Supabase database:

### scan_requests table
- Standard fields: id, company_name, website_url, company_description, report_type, industry, priority, status, requestor_id, requestor_email, created_at, updated_at
- metadata field (JSONB) to store:
  - admin_initiated: boolean
  - initiated_by: string
  - initiated_at: timestamp
  - investment_thesis or sales_context objects
  - job_ids object

## API Integration

The frontend is ready to work with the backend API. When the API server is running with proper environment variables, it will:
1. Process admin scan requests
2. Queue evidence collection and report generation jobs
3. Provide job status updates
4. Handle scan retries

## Next Steps

1. Ensure all environment variables are properly configured
2. Run the API server with workers for full functionality
3. Test the complete flow from scan creation to report generation
4. Monitor the Redis queue for job processing

## Success Indicators

- ✅ Admin can create scans for any company without client workflow
- ✅ Support for both PE and Sales Intelligence contexts
- ✅ Real-time status updates
- ✅ Priority-based queue management
- ✅ Comprehensive scan details and job tracking
- ✅ Clean integration with existing navigation