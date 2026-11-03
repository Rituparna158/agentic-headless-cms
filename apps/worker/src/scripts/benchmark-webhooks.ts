import http from 'node:http';
import crypto from 'node:crypto';
import { getQueue, QUEUE_NAMES, type WebhookJobData } from '@repo/config';
import { WebhooksRepository } from '@repo/repository';
import { setupWebhookWorker } from '../webhook.worker.js';

interface ReceivedRequest {
  id: string;
  signature: string;
  event: string;
  validSignature: boolean;
  timestamp: number;
}

async function runBenchmark() {
  console.log('='.repeat(70));
  console.log('  WEBHOOK HIGH-CONCURRENCY BENCHMARK (100 SIMULTANEOUS DELIVERIES)');
  console.log('='.repeat(70));

  const PORT = 9876;
  const SECRET_KEY = 'super-secret-benchmark-key';
  const TOTAL_JOBS = 100;
  const WORKER_CONCURRENCY = 20;
  const received: ReceivedRequest[] = [];

  // Step 1: Start lightweight mock HTTP receiver
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const sig = (req.headers['x-agentic-signature'] as string) || '';
      const event = (req.headers['x-agentic-event'] as string) || '';
      const deliveryId = (req.headers['x-agentic-delivery-id'] as string) || '';

      const expectedSig = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(body)
        .digest('hex');

      const isValid = sig === expectedSig;

      received.push({
        id: deliveryId,
        signature: sig,
        event,
        validSignature: isValid,
        timestamp: Date.now(),
      });

      // Simulate realistic 20ms network latency
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', received: true }));
      }, 20);
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[1/5] Local mock webhook receiver listening on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });

  // Step 2: Ensure a test webhook exists in PostgreSQL for foreign key validity
  const repository = new WebhooksRepository();
  const [existingWebhooks] = await repository.list({ limit: 10 });
  let targetWebhook = existingWebhooks.find((w) => w.url.includes(`:${PORT}`));

  if (!targetWebhook && existingWebhooks.length > 0) {
    // Reuse existing valid application or webhook
    const appWebhook = existingWebhooks[0]!;
    console.log(`[2/5] Creating benchmark webhook in PostgreSQL (applicationId: ${appWebhook.applicationId})...`);
    targetWebhook = await repository.create({
      name: 'Local Concurrency Benchmark Hook',
      url: `http://127.0.0.1:${PORT}/webhook`,
      events: ['content.published'],
      isActive: true,
      secretKey: SECRET_KEY,
      applicationId: appWebhook.applicationId,
    });
  } else if (!targetWebhook) {
    console.log('[2/5] Creating benchmark webhook in PostgreSQL with default application...');
    targetWebhook = await repository.create({
      name: 'Local Concurrency Benchmark Hook',
      url: `http://127.0.0.1:${PORT}/webhook`,
      events: ['content.published'],
      isActive: true,
      secretKey: SECRET_KEY,
    });
  } else {
    console.log(`[2/5] Reusing existing benchmark webhook record: ${targetWebhook.id}`);
  }

  // Step 3: Enqueue 100 jobs in bulk (Simulating API behavior)
  const queue = getQueue(QUEUE_NAMES.WEBHOOK_DISPATCH);
  // Clean any leftover jobs from previous runs
  await queue.drain();

  console.log(`[3/5] Constructing and bulk-enqueueing ${TOTAL_JOBS} webhook jobs into Redis...`);
  const jobs = Array.from({ length: TOTAL_JOBS }, (_, i) => ({
    name: `webhook:benchmark:${targetWebhook!.id}:${i + 1}`,
    data: {
      webhookId: targetWebhook!.id,
      applicationId: targetWebhook!.applicationId,
      url: `http://127.0.0.1:${PORT}/webhook`,
      secretKey: SECRET_KEY,
      eventType: 'content.published',
      payload: {
        event: 'content.published',
        contentId: `bench-article-${i + 1}`,
        title: `Automated Load Test Post #${i + 1}`,
        author: 'Performance Test Suite',
        publishedAt: new Date().toISOString(),
      },
      deliveryId: crypto.randomUUID(),
    } satisfies WebhookJobData,
  }));

  const enqueueStart = performance.now();
  await queue.addBulk(jobs);
  const enqueueDurationMs = performance.now() - enqueueStart;
  console.log(`      Bulk enqueue completed in: ${enqueueDurationMs.toFixed(2)} ms`);
  console.log(`      Average enqueue time per job: ${(enqueueDurationMs / TOTAL_JOBS).toFixed(3)} ms`);

  // Step 4: Start Webhook Worker with concurrency 20
  console.log(`[4/5] Spawning BullMQ Webhook Worker (concurrency: ${WORKER_CONCURRENCY})...`);
  const workerStart = performance.now();
  const worker = setupWebhookWorker(WORKER_CONCURRENCY);

  // Step 5: Wait for all 100 jobs to be processed
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout: Only received ${received.length}/${TOTAL_JOBS} webhooks after 30 seconds`));
    }, 30000);

    const interval = setInterval(() => {
      if (received.length >= TOTAL_JOBS) {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve();
      }
    }, 50);
  });

  const workerDurationMs = performance.now() - workerStart;
  const throughput = (TOTAL_JOBS / (workerDurationMs / 1000)).toFixed(1);

  // Verification
  const validSignatures = received.filter((r) => r.validSignature).length;
  const deliveriesInDb = await repository.listDeliveries(targetWebhook.id, undefined, 200);

  console.log('\n' + '='.repeat(70));
  console.log('  LOAD TEST RESULTS & BENCHMARK METRICS');
  console.log('='.repeat(70));
  console.log(`  Jobs Dispatched:           ${TOTAL_JOBS}`);
  console.log(`  API Bulk Enqueue Time:     ${enqueueDurationMs.toFixed(2)} ms`);
  console.log(`  Average Enqueue Per Job:   ${(enqueueDurationMs / TOTAL_JOBS).toFixed(3)} ms`);
  console.log(`  Total Worker Drain Time:   ${(workerDurationMs / 1000).toFixed(2)} seconds`);
  console.log(`  Worker Concurrency:        ${WORKER_CONCURRENCY} parallel HTTP threads`);
  console.log(`  Overall Throughput:        ${throughput} webhooks / second`);
  console.log(`  HTTP Deliveries Received:  ${received.length} / ${TOTAL_JOBS}`);
  console.log(`  HMAC-SHA256 Signatures:    ${validSignatures} / ${TOTAL_JOBS} valid`);
  console.log(`  PostgreSQL Logs Recorded:  ${deliveriesInDb.length} delivery records in DB`);
  console.log('='.repeat(70));

  // Cleanup
  console.log('\nCleaning up resources...');
  await worker.close();
  await queue.close();
  server.close();

  if (targetWebhook && targetWebhook.name === 'Local Concurrency Benchmark Hook') {
    try {
      await repository.delete(targetWebhook.id);
      console.log('Temporary benchmark webhook removed from DB.');
    } catch {
      // Ignored
    }
  }

  console.log('Benchmark completed successfully.\n');
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
