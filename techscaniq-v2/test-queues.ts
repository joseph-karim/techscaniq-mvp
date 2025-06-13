#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();
import { queues, getAllQueueStatuses, JobPriority } from './src/services/queue/index';
import { queueMonitor } from './src/services/queue/monitor';

async function testQueues() {
  console.log('🧪 Testing TechScanIQ Queue System...\n');

  try {
    // Check initial queue status
    console.log('📊 Initial Queue Status:');
    const initialStatus = await getAllQueueStatuses();
    console.table(initialStatus);

    // Test 1: Add a search job
    console.log('\n🔍 Test 1: Adding search job...');
    const searchJob = await queues.search.add('test-search', {
      query: 'OpenAI o3 model capabilities',
      type: 'web',
      pillarId: 'tech-architecture',
      questionId: 'test-q-1',
      options: { limit: 5 },
    }, {
      priority: JobPriority.HIGH,
    });
    console.log(`✅ Search job added: ${searchJob.id}`);

    // Test 2: Add an analysis job
    console.log('\n📄 Test 2: Adding analysis job...');
    const analysisJob = await queues.analysis.add('test-analysis', {
      url: 'https://openai.com',
      type: 'content',
    }, {
      priority: JobPriority.NORMAL,
    });
    console.log(`✅ Analysis job added: ${analysisJob.id}`);

    // Test 3: Add a quality evaluation job
    console.log('\n🎯 Test 3: Adding quality evaluation job...');
    const qualityJob = await queues.quality.add('test-quality', {
      evidence: {
        id: 'test-evidence-1',
        researchQuestionId: 'test-q-1',
        pillarId: 'tech-architecture',
        source: {
          type: 'web',
          name: 'Test Source',
          url: 'https://example.com',
          credibilityScore: 0.8,
        },
        content: 'This is test evidence content about OpenAI o3 model...',
        metadata: {
          extractedAt: new Date(),
          extractionMethod: 'test',
          wordCount: 10,
          language: 'en',
          keywords: ['openai', 'o3', 'model'],
        },
        qualityScore: {
          overall: 0,
          components: {
            relevance: 0,
            credibility: 0,
            recency: 0,
            specificity: 0,
            bias: 0,
          },
          reasoning: 'Pending evaluation',
        },
        createdAt: new Date(),
      },
      context: {
        researchQuestion: 'What are the capabilities of OpenAI o3 model?',
        pillarName: 'Tech Architecture',
        thesisStatement: 'OpenAI is leading in AI model development',
      },
    }, {
      priority: JobPriority.LOW,
    });
    console.log(`✅ Quality job added: ${qualityJob.id}`);

    // Wait a bit for jobs to process
    console.log('\n⏳ Waiting 5 seconds for jobs to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check queue status after adding jobs
    console.log('\n📊 Queue Status After Adding Jobs:');
    const statusAfter = await getAllQueueStatuses();
    console.table(statusAfter);

    // Monitor specific queues
    console.log('\n📈 Detailed Queue Metrics:');
    const metrics = await queueMonitor.getQueueMetrics();
    console.table(metrics);

    // Check completed jobs
    console.log('\n✅ Checking completed jobs...');
    const completedSearch = await queueMonitor.getCompletedJobs('search', 5);
    console.log(`Search queue completed: ${completedSearch.length} jobs`);

    const completedAnalysis = await queueMonitor.getCompletedJobs('analysis', 5);
    console.log(`Analysis queue completed: ${completedAnalysis.length} jobs`);

    const completedQuality = await queueMonitor.getCompletedJobs('quality', 5);
    console.log(`Quality queue completed: ${completedQuality.length} jobs`);

    // Generate report
    console.log('\n📋 Queue Report:');
    const report = await queueMonitor.generateReport();
    console.log(report);

    // Test orchestration
    console.log('\n🎭 Test 4: Testing orchestration...');
    const orchestrationJob = await queues.orchestration.add('test-orchestration', {
      type: 'technical_analysis',
      stateId: 'test-state-1',
      data: {
        urls: ['https://openai.com', 'https://anthropic.com'],
      },
    });
    console.log(`✅ Orchestration job added: ${orchestrationJob.id}`);

    // Subscribe to events
    console.log('\n📡 Subscribing to queue events...');
    queueMonitor.subscribeToQueueEvents('search', {
      onCompleted: (jobId, result) => {
        console.log(`  ✅ Search job ${jobId} completed`);
      },
      onFailed: (jobId, reason) => {
        console.log(`  ❌ Search job ${jobId} failed: ${reason}`);
      },
      onProgress: (jobId, progress) => {
        console.log(`  📊 Search job ${jobId} progress: ${progress}%`);
      },
    });

    // Wait for final processing
    console.log('\n⏳ Waiting 10 seconds for final processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Final status
    console.log('\n📊 Final Queue Status:');
    const finalStatus = await getAllQueueStatuses();
    console.table(finalStatus);

    console.log('\n✅ Queue system test completed!');
    console.log('   Note: Workers must be running for jobs to be processed.');
    console.log('   Run "npm run workers" in another terminal to start workers.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close connections
    console.log('\n🔌 Closing queue connections...');
    await queues.search.close();
    await queues.analysis.close();
    await queues.quality.close();
    await queues.orchestration.close();
    await queues.technical.close();
    await queues.api.close();
    
    // Close the main connection
    const { connection } = await import('./src/services/queue/index');
    await connection.quit();
    
    console.log('✅ All connections closed');
    process.exit(0);
  }
}

// Run the test
testQueues().catch(console.error);