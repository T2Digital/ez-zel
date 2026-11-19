import { readPersistentJson, savePersistentJson } from './persistentStorage';

export type PublishJobStatus = 'pending' | 'retry_scheduled' | 'published' | 'failed';

export interface SocialPublishJob {
  id: string;
  brandId: string;
  platforms: string[];
  content: string;
  mediaUrls: string[];
  scheduledFor: string;
  status: PublishJobStatus;
  attempts: number;
  maxRetries: number;
  nextAttemptAt: string;
  lastError?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const DOC_KEY = 't2_social_publish_queue';
const FILE_NAME = 't2_social_publish_queue.json';
const BACKOFF_MINUTES = [2, 10, 30];

function loadJobs(): SocialPublishJob[] {
  const raw = readPersistentJson<SocialPublishJob[]>(FILE_NAME, []);
  return Array.isArray(raw) ? raw : [];
}

function saveJobs(jobs: SocialPublishJob[]): void {
  savePersistentJson(DOC_KEY, FILE_NAME, jobs.slice(0, 500));
}

export function enqueueSocialPublishJob(input: {
  brandId: string;
  platforms: string[];
  content: string;
  mediaUrls?: string[];
  scheduledFor?: string;
  maxRetries?: number;
}): SocialPublishJob {
  const now = new Date().toISOString();
  const job: SocialPublishJob = {
    id: `pub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    brandId: String(input.brandId || 't2_digital_os').trim(),
    platforms: Array.isArray(input.platforms) && input.platforms.length > 0 ? input.platforms : ['facebook'],
    content: String(input.content || '').trim(),
    mediaUrls: Array.isArray(input.mediaUrls) ? input.mediaUrls.filter(Boolean) : [],
    scheduledFor: input.scheduledFor || now,
    status: 'pending',
    attempts: 0,
    maxRetries: Math.max(1, Number(input.maxRetries || 3)),
    nextAttemptAt: input.scheduledFor || now,
    createdAt: now,
    updatedAt: now,
  };
  const jobs = loadJobs();
  jobs.unshift(job);
  saveJobs(jobs);
  return job;
}

export function listSocialPublishJobs(brandId?: string): SocialPublishJob[] {
  const jobs = loadJobs();
  if (!brandId) return jobs;
  const target = String(brandId).trim().toLowerCase();
  return jobs.filter((j) => j.brandId.toLowerCase() === target);
}

export function removePublishJobForTest(jobId: string): void {
  const jobs = loadJobs().filter((j) => j.id !== jobId);
  saveJobs(jobs);
}

export async function processDuePublishJobs(
  executorFn?: (job: SocialPublishJob) => Promise<{ ok: boolean; error?: string }>
): Promise<{ processed: number; published: number; retryScheduled: number; failed: number }> {
  const jobs = loadJobs();
  const nowMs = Date.now();
  let processed = 0;
  let published = 0;
  let retryScheduled = 0;
  let failed = 0;

  const defaultExecutor = async (job: SocialPublishJob) => {
    const { titoStudioApi } = await import('./titoStudioApiClient');
    const res: any = await titoStudioApi.executeAction('publish.multi_platform', {
      brandId: job.brandId,
      clinicId: job.brandId,
      platforms: job.platforms,
      content: job.content,
      mediaUrls: job.mediaUrls,
    });
    if (res && (res.success === true || res.ok === true)) {
      return { ok: true };
    }
    return { ok: false, error: res?.error || 'Studio publish.multi_platform failed' };
  };

  const runExec = executorFn || defaultExecutor;

  for (const job of jobs) {
    if (job.status !== 'pending' && job.status !== 'retry_scheduled') continue;
    const dueMs = new Date(job.nextAttemptAt || job.scheduledFor).getTime();
    if (!Number.isNaN(dueMs) && dueMs > nowMs) continue;

    processed += 1;
    job.attempts += 1;
    job.updatedAt = new Date().toISOString();

    try {
      const outcome = await runExec(job);
      if (outcome.ok) {
        job.status = 'published';
        job.publishedAt = new Date().toISOString();
        job.lastError = undefined;
        published += 1;
        continue;
      }
      job.lastError = outcome.error || 'Unknown publish failure';
    } catch (err: any) {
      job.lastError = err?.message || 'Exception during publish';
    }

    if (job.attempts >= job.maxRetries) {
      job.status = 'failed';
      failed += 1;
    } else {
      const delayMin = BACKOFF_MINUTES[Math.min(job.attempts - 1, BACKOFF_MINUTES.length - 1)] || 30;
      job.status = 'retry_scheduled';
      job.nextAttemptAt = new Date(Date.now() + delayMin * 60 * 1000).toISOString();
      retryScheduled += 1;
    }
  }

  if (processed > 0) {
    saveJobs(jobs);
  }
  return { processed, published, retryScheduled, failed };
}
