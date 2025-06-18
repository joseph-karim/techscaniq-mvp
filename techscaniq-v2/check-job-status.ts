import { queues } from './src/services/queue/index';

async function checkJobStatus() {
  const researchId = '63b25e5e-14ce-4b9d-8538-a5e1da5974dd';
  
  // Check orchestration queue
  const activeJobs = await queues.orchestration.getActive();
  console.log(`\n🔄 Active orchestration jobs: ${activeJobs.length}`);
  
  for (const job of activeJobs) {
    if (job.data.stateId === researchId) {
      console.log('\n📊 Found active job for research:');
      console.log(`   Job ID: ${job.id}`);
      console.log(`   Progress: ${job.progress}%`);
      console.log(`   Started: ${new Date(job.timestamp).toLocaleTimeString()}`);
      console.log(`   Data:`, job.data);
      
      // Get job logs
      const logs = await job.getJobLogs();
      if (logs.logs.length > 0) {
        console.log('\n📝 Recent logs:');
        logs.logs.slice(-10).forEach(log => console.log(`   ${log}`));
      }
    }
  }
  
  // Check other queues
  const searchJobs = await queues.search.getActive();
  const technicalJobs = await queues.technical.getActive();
  
  console.log(`\n🔍 Active search jobs: ${searchJobs.length}`);
  console.log(`🔧 Active technical jobs: ${technicalJobs.length}`);
  
  // Check completed jobs
  const completedJobs = await queues.orchestration.getCompleted();
  const recentCompleted = completedJobs.filter(job => 
    job.data.stateId === researchId || 
    (Date.now() - job.finishedOn!) < 300000 // Last 5 minutes
  );
  
  if (recentCompleted.length > 0) {
    console.log(`\n✅ Recently completed jobs: ${recentCompleted.length}`);
    recentCompleted.forEach(job => {
      console.log(`   Job ${job.id}: ${job.returnvalue?.success ? 'Success' : 'Failed'}`);
    });
  }
  
  process.exit(0);
}

checkJobStatus().catch(console.error);