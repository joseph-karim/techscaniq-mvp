#!/usr/bin/env node
import { StorageService } from '../src/services/storage';
import * as fs from 'fs/promises';
import * as path from 'path';

async function loadCIBCData() {
  console.log('📊 Loading CIBC Adobe data into API storage...');
  
  const storage = new StorageService();
  
  // Load the completed CIBC report
  const dataPath = path.join(process.cwd(), 'data', 'integrated-results', 'cibc-adobe-integrated-2025-06-20T03-35-47-463Z.json');
  
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    const cibcData = JSON.parse(data);
    
    // Save to storage with the expected ID
    const reportId = 'cibc-adobe-sales-2024';
    await storage.saveLangGraphReport(reportId, {
      reportId,
      company: 'CIBC',
      website: 'https://www.cibc.com',
      reportType: 'sales-intelligence' as const,
      status: 'completed' as const,
      createdAt: new Date(cibcData.metadata?.reportGeneratedAt || Date.now()),
      completedAt: new Date(cibcData.metadata?.reportGeneratedAt || Date.now()),
      thesis: cibcData.thesis,
      evidence: cibcData.evidence,
      report: cibcData.report,
      metadata: cibcData.metadata,
    });
    
    console.log('✅ CIBC data loaded successfully!');
    console.log(`📈 Evidence count: ${cibcData.evidence?.length || 0}`);
    console.log(`🎯 Report ID: ${reportId}`);
    
  } catch (error) {
    console.error('❌ Failed to load CIBC data:', error);
  }
}

loadCIBCData();