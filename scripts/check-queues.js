import { Queue } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
})

async function checkQueues() {
  const evidenceQueue = new Queue('evidence-collection', { connection })
  const reportQueue = new Queue('report-generation', { connection })
  
  console.log('Evidence Collection Queue:')
  console.log('Waiting:', await evidenceQueue.getWaitingCount())
  console.log('Active:', await evidenceQueue.getActiveCount())
  console.log('Completed:', await evidenceQueue.getCompletedCount())
  console.log('Failed:', await evidenceQueue.getFailedCount())
  console.log('Delayed:', await evidenceQueue.getDelayedCount())
  
  console.log('\nReport Generation Queue:')
  console.log('Waiting:', await reportQueue.getWaitingCount())
  console.log('Active:', await reportQueue.getActiveCount())
  console.log('Completed:', await reportQueue.getCompletedCount())
  console.log('Failed:', await reportQueue.getFailedCount())
  console.log('Delayed:', await reportQueue.getDelayedCount())
  
  // Get failed jobs
  const failedJobs = await reportQueue.getFailed()
  if (failedJobs.length > 0) {
    console.log('\nFailed Jobs:')
    for (const job of failedJobs) {
      console.log(`Job ${job.id}: ${job.name}`)
      console.log('Failed reason:', job.failedReason)
      console.log('Stack:', job.stacktrace?.slice(0, 500))
      console.log('Data:', job.data)
    }
  }
  
  process.exit(0)
}

checkQueues().catch(console.error)