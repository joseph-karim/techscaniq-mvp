import { StorageService } from './src/services/storage';

async function test() {
  const storage = new StorageService();
  
  // Test with the current research ID
  const researchId = '07677203-0949-42f5-bb22-7fe37f43478a';
  
  console.log('Testing load for research ID:', researchId);
  const state = await storage.loadResearchState(researchId);
  
  if (state) {
    console.log('✅ State loaded successfully');
    console.log('Status:', state.status);
    console.log('Evidence count:', state.evidence.length);
    console.log('Thesis company:', state.thesis.company);
  } else {
    console.log('❌ State not found');
  }
}

test().catch(console.error);