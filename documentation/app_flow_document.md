# TechScan IQ App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new user first visits the TechScan IQ landing page, they see a clean header with a brief description of our platform and a call-to-action button labeled “Get Started.” Clicking that button brings them to a page where they can choose to register using an email and password or sign in instantly through Google or Microsoft single sign-on. If they select email and password, they enter their name, organization name, email address, and a password that meets our minimum security rules. After submitting, they receive an email verification link. Upon clicking the link, they are brought back to the app to verify their address and continue setup. If they choose social login, they are redirected to the provider’s consent screen and then returned to TechScan IQ with their workspace automatically created. 

Should a user forget their password, a “Forgot Password” link under the login form takes them to a page to enter their email. We send a time-limited reset link that leads to a secure form where they choose a new password. After resetting, they are redirected to the login page. Signing out is as simple as clicking the user avatar in the top header and choosing “Sign Out,” which returns them to the landing page.

## Main Dashboard or Home Page

After successfully signing in, the user lands on their personal dashboard. At the top left of the screen, the TechScan IQ logo sits alongside a horizontal menu containing links to Dashboard, Request Scan, Reports, and Settings. On the left side is a vertical navigation bar allowing quick access to each section and displaying the user’s name and organization. In the central area, a prominent gauge chart shows the latest Tech Health Score. Below that, a row of colored risk cards summarizes critical, high, medium, and low findings. Further down, a concise summary outlines key insights and matches to the user’s saved investment theses. The header also includes a bell icon for notifications and the user avatar for account actions. From here, the user can jump to any part of the application by clicking a navigation link or a card.

## Detailed Feature Flows and Page Transitions

When the user clicks “Request Scan,” they are taken to a clean form page. Here they enter the target company’s name, website URL, and an optional description. They can then select thesis tags from a searchable dropdown or type in custom primary and secondary criteria in character-limited text areas. After reviewing the details, they click “Submit Scan Request.” This action displays a confirmation modal and then navigates them to a scan status page showing the new request in a list along with its status, which begins as “Pending.”

As the AI engines kick off, the status updates first to “Processing.” The user can refresh manually or wait for a real-time update pushed from Supabase. Once the AI draft is ready, the status changes to “Awaiting Review.” At that moment, administrators receive a notification to begin human-in-the-loop verification.

When an administrator signs in, they land on an Admin Dashboard listing all scans for all tenant organizations. Each scan shows its status, submission time, and a link to an advisor review interface. The admin clicks on a scan and opens a split-screen view. The left pane displays AI-generated sections in order, from tech stack analysis to security and compliance. The right pane lets the admin add notes, approve, modify, or flag each section. At the top, quick buttons enable bulk approval for straightforward sections. Once the admin finishes and clicks “Publish Report,” the scan status transitions to “Complete for User.”

Back on the investor’s dashboard, a push notification appears next to the bell icon indicating that their report is ready. Clicking this notification navigates directly to the detailed report page for that scan. The report page starts with the updated Tech Health Score gauge, followed by risk assessment cards. Scrolling reveals the architecture analysis module with an interactive diagram, then the security posture radar chart, and the code quality and DevOps maturity section. A separate area shows thesis alignment with enabler, blocker, and neutral findings. Throughout the page, every key insight has a clickable breadcrumb link that opens a modal with full evidence details, including source URL, timestamp, confidence score, and citation verification status.

If the user wishes to export a white-labeled report, they click the “Export PDF” button in the top right. This opens a modal where they upload an optional logo, set header and footer text, and choose a cover page color theme. After clicking “Generate PDF,” the system compiles the report and offers a download link.

## Settings and Account Management

In the Settings section, the user can update personal information such as name, email, and password. A separate tab handles notification preferences where they toggle push notifications for scan completions, review requests, and risk alerts. In a Billing tab, they enter payment details to fund pay-per-scan credits and view their transaction history with dates, scan names, and charges. After updating any setting, a confirmation toast appears and they remain on the Settings page. A link at the top of the page returns them to the main Dashboard.

Administrators have an additional section under Settings for workspace management. They can invite new advisor or admin users by email, assign roles, and view active sessions. Any changes here automatically reflect in the navigation menus and permissions throughout the app.

## Error States and Alternate Paths

If a user enters an invalid email or password at sign-in, an inline error message prompts them to correct the fields. Submitting a request scan form with an invalid URL or criteria exceeding character limits shows specific error text beneath the offending input. During upload of header or footer images, file type or size violations produce a clear message and prevent submission until resolved.

When connectivity is lost, a discreet banner appears at the top stating “You are offline” and disables form submissions while allowing the user to review existing data. If an API call fails with a server error, a friendly fallback screen explains that something went wrong and offers a Retry button. For unauthorized access attempts, such as a locked admin page, the user sees a brief message telling them to contact support if they believe they should have permission. All error states provide a path back to the last known good page or the main Dashboard.

## Conclusion and Overall App Journey

From the moment an investor signs up, TechScan IQ guides them through a seamless process of launching technical due diligence. They authenticate via email or social login, land on a rich dashboard, and easily initiate new scans with customizable thesis criteria. Behind the scenes, AI models analyze the target, then administrators verify the draft in a dedicated review interface. The investor is notified the instant the polished report is ready, and they can explore interactive findings, dive into evidence, and export a branded PDF. Along the way, account settings, billing, and notifications remain intuitive, and thoughtful error handling ensures users keep moving forward. In daily use, investors rely on TechScan IQ to deliver fast, clear, and actionable technical insights that support confident investment decisions.