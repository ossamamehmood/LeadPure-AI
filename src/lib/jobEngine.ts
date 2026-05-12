import fs from 'fs/promises';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { validateEmailFull, ValidationOptions } from './validator';

const DATA_DIR = path.join(process.cwd(), 'data', 'jobs');

// Ensure directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export interface JobMeta {
  jobId: string;
  status: 'running' | 'completed' | 'cancelled' | 'failed';
  total: number;
  processed: number;
  progress: number;
  filename: string;
  startTime: number;
  endTime?: number;
}

export const createJob = async (records: any[], options: ValidationOptions, mappings: any, filename: string) => {
  const jobId = randomUUID();
  const meta: JobMeta = {
    jobId,
    status: 'running',
    total: records.length,
    processed: 0,
    progress: 0,
    filename,
    startTime: Date.now()
  };

  await fs.writeFile(path.join(DATA_DIR, `${jobId}_meta.json`), JSON.stringify(meta));
  // Create empty results and logs file
  await fs.writeFile(path.join(DATA_DIR, `${jobId}_results.jsonl`), '');
  await fs.writeFile(path.join(DATA_DIR, `${jobId}_logs.txt`), '');

  // Start processing in background (DO NOT AWAIT)
  processJob(jobId, records, options, mappings).catch(err => {
    console.error(`Job ${jobId} failed:`, err);
    updateJobMeta(jobId, { status: 'failed' });
  });

  return jobId;
};

const updateJobMeta = async (jobId: string, updates: Partial<JobMeta>) => {
  try {
    const metaPath = path.join(DATA_DIR, `${jobId}_meta.json`);
    const data = await fs.readFile(metaPath, 'utf8');
    const meta = JSON.parse(data) as JobMeta;
    Object.assign(meta, updates);
    await fs.writeFile(metaPath, JSON.stringify(meta));
  } catch (err) {
    console.error(`Failed to update meta for ${jobId}`, err);
  }
};

const logToJob = async (jobId: string, message: string) => {
  try {
    await fs.appendFile(path.join(DATA_DIR, `${jobId}_logs.txt`), message + '\n');
  } catch (err) {}
};

const processJob = async (jobId: string, records: any[], options: ValidationOptions, mappings: any) => {
  const resultsStream = createWriteStream(path.join(DATA_DIR, `${jobId}_results.jsonl`), { flags: 'a' });
  
  const CONCURRENCY = 5; // Protect server event loop and prevent IP ban
  let activePromises = new Set<Promise<void>>();

  let processedCount = 0;

  for (let i = 0; i < records.length; i++) {
    // Check cancellation
    const metaPath = path.join(DATA_DIR, `${jobId}_meta.json`);
    try {
      const metaStr = await fs.readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaStr);
      if (meta.status === 'cancelled') {
        await logToJob(jobId, '❌ Job cancelled by user.');
        break;
      }
    } catch {} // ignore read errors for speed

    const record = records[i];
    const rawEmail = String(record[mappings.emailKey] || '').trim();

    if (!rawEmail) {
      processedCount++;
      continue; // Skip empty
    }

    const verifyTask = (async () => {
      try {
        const result = await validateEmailFull(rawEmail, options);
        
        // Log to terminal file
        let icon = '✅';
        if (result.verificationStatus === 'dangerous') icon = '❌';
        else if (result.verificationStatus === 'risky') icon = '⚠️';
        else if (result.verificationStatus === 'usable') icon = '🛡️';
        
        await logToJob(jobId, `${icon} ${result.email} → ${result.verificationStatus.toUpperCase()} (${result.verificationReason})`);

        // Append to JSONL
        const enhancedRecord = { ...record, ...result };
        resultsStream.write(JSON.stringify(enhancedRecord) + '\n');
        
        processedCount++;
        if (processedCount % 10 === 0 || processedCount === records.length) {
          const progress = Math.round((processedCount / records.length) * 100);
          await updateJobMeta(jobId, { processed: processedCount, progress });
        }
      } catch (err: any) {
        await logToJob(jobId, `🚨 Error processing ${rawEmail}: ${err.message}`);
        processedCount++;
      }
    })();

    activePromises.add(verifyTask);
    verifyTask.finally(() => activePromises.delete(verifyTask));

    if (activePromises.size >= CONCURRENCY) {
      await Promise.race(activePromises);
    }
  }

  await Promise.all(activePromises);
  resultsStream.end();

  // Mark completed if not cancelled
  const metaStr = await fs.readFile(path.join(DATA_DIR, `${jobId}_meta.json`), 'utf8');
  const meta = JSON.parse(metaStr);
  if (meta.status === 'running') {
    await updateJobMeta(jobId, { status: 'completed', endTime: Date.now() });
    await logToJob(jobId, '🎉 Verification Job Completed Successfully.');
  }
};

export const getJobStatus = async (jobId: string) => {
  try {
    const metaStr = await fs.readFile(path.join(DATA_DIR, `${jobId}_meta.json`), 'utf8');
    const meta = JSON.parse(metaStr);
    
    // Get last 50 lines of logs
    const logPath = path.join(DATA_DIR, `${jobId}_logs.txt`);
    let logs = '';
    if (existsSync(logPath)) {
      const allLogs = await fs.readFile(logPath, 'utf8');
      const lines = allLogs.trim().split('\n');
      logs = lines.slice(-50).join('\n');
    }

    return { ...meta, logs };
  } catch (err) {
    return null;
  }
};

export const cancelJob = async (jobId: string) => {
  await updateJobMeta(jobId, { status: 'cancelled', endTime: Date.now() });
  return true;
};

// Instead of downloading right here, we will just stream the jsonl file back and parse it in Express.
export const getJobResultsPath = (jobId: string) => {
  return path.join(DATA_DIR, `${jobId}_results.jsonl`);
};
