import { Queue } from 'bullmq';
import { env } from '@repo/config';

async function run() {
  const mediaQueue = new Queue('media-processing', {
    connection: { url: env.REDIS_URL },
  });

  const failed = await mediaQueue.getFailed();
  console.log(`Found ${failed.length} failed jobs. Retrying...`);

  for (const job of failed) {
    await job.retry();
    console.log(`Retried job ${job.id}`);
  }

  process.exit(0);
}

run().catch(console.error);
