flowchart TD
    Start[Start] --> Login[User Login]
    Login --> Role{User Role?}
    Role -->|Investor| InvestorDash[Investor Dashboard]
    Role -->|Admin| AdminDash[Admin Dashboard]
    InvestorDash --> NewScan[New Scan]
    NewScan --> Thesis[Enter Thesis and Criteria]
    Thesis --> SubmitScan[Submit Scan]
    SubmitScan --> DataGathering[AI and Data Gathering]
    DataGathering --> InProgress[Scan In Progress]
    InProgress --> ScanComplete[Scan Complete]
    ScanComplete --> Dash[Interactive Dashboard]
    Dash --> TechHealth[Tech Health Score Module]
    Dash --> RiskAssess[Risk Assessment Module]
    Dash --> Architecture[Architecture Analysis Module]
    Dash --> Security[Security and Compliance Module]
    Dash --> CodeQuality[Code Quality and DevOps Module]
    TechHealth --> Details[View Module Details]
    RiskAssess --> Details
    Architecture --> Details
    Security --> Details
    CodeQuality --> Details
    Details --> Evidence[Evidence and Citations]
    Evidence --> EvidenceModal[Open Evidence Modal]
    Dash --> ThesisAlign[Thesis Alignment Visualization]
    ThesisAlign --> AlignDetails[View Enablers and Blockers]
    Dash --> ExportPDF[Export PDF Report]
    ScanComplete --> NotifyInvestor[Notify Investor]
    NotifyInvestor --> PushNotify[Push Notification]
    AdminDash --> ReviewScans[Review Pending Scans]
    ReviewScans --> AdvisorWorkflow[Advisor Review Workflow]
    AdvisorWorkflow --> Validate[Validate Findings]
    Validate --> ReviewComplete[Complete Review]
    ReviewComplete --> NotifyInvestor