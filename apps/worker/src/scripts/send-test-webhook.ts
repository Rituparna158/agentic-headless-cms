import crypto from 'node:crypto';
import { getQueue, QUEUE_NAMES, type WebhookJobData } from '@repo/config';
import { WebhooksRepository } from '@repo/repository';
import { setupWebhookWorker } from '../webhook.worker.js';

async function sendLiveWebhooks() {
  const targetUrl = 'https://webhook.site/908b138e-fdbb-4fc0-87ca-b945bb01a0eb';
  const secretKey = 'cms-production-secret-demo';

  console.log(`Sending live webhooks to ${targetUrl}...`);

  const repository = new WebhooksRepository();
  const [existingWebhooks] = await repository.list({ limit: 5 });
  const appId = existingWebhooks[0]?.applicationId || '6704ffb0-5a44-4535-b940-46b411c93418';
  const webhookId = existingWebhooks[0]?.id || crypto.randomUUID();

  const events = [
    {
      eventType: 'content.published',
      payload: {
        event: 'content.published',
        contentId: 'art-prod-101',
        title: 'Welcome to Agentic Headless CMS v1.0.0',
        slug: 'welcome-agentic-headless-cms',
        status: 'published',
        publishedAt: new Date().toISOString(),
        author: {
          name: 'Editorial Team',
          email: 'editor@agentic-cms.io',
        },
      },
    },
    {
      eventType: 'content.updated',
      payload: {
        event: 'content.updated',
        contentId: 'art-prod-102',
        title: 'Enterprise Scalable Webhooks Guide',
        version: 3,
        updatedFields: ['body', 'seoMetadata'],
        updatedAt: new Date().toISOString(),
      },
    },
    {
      eventType: 'media.uploaded',
      payload: {
        event: 'media.uploaded',
        fileId: 'media-8849',
        filename: 'architecture-diagram-v2.png',
        mimeType: 'image/png',
        sizeBytes: 1048576,
        dimensions: { width: 1920, height: 1080 },
        url: 'https://cdn.agentic-cms.io/assets/architecture-diagram-v2.png',
      },
    },
  ];

  const queue = getQueue(QUEUE_NAMES.WEBHOOK_DISPATCH);

  const jobs = events.map((ev, idx) => ({
    name: `webhook:live:${idx + 1}`,
    data: {
      webhookId,
      applicationId: appId,
      url: targetUrl,
      secretKey,
      eventType: ev.eventType,
      payload: ev.payload,
      deliveryId: crypto.randomUUID(),
    } satisfies WebhookJobData,
  }));

  console.log(`Enqueueing ${jobs.length} jobs to BullMQ...`);
  await queue.addBulk(jobs);

  console.log('Starting Webhook Worker to process queue...');
  let completed = 0;
  const worker = setupWebhookWorker(5);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve();
    }, 15000);

    worker.on('completed', (job) => {
      completed++;
      console.log(`[Worker] Delivered event '${job.data.eventType}' to Webhook.site! (Job ID: ${job.id})`);
      if (completed >= jobs.length) {
        clearTimeout(timeout);
        resolve();
      }
    });

    worker.on('failed', (job, err) => {
      console.error(`[Worker] Failed to deliver job ${job?.id}:`, err);
    });
  });

  await worker.close();
  await queue.close();
  console.log('All live test webhooks dispatched and processed.');
  process.exit(0);
}

sendLiveWebhooks().catch((err) => {
  console.error(err);
  process.exit(1);
});

