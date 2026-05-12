import { Router } from 'express';
import { createJob, getJobStatus, cancelJob, getJobResultsPath } from '../src/lib/jobEngine';
import fs from 'fs';
import readline from 'readline';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { emails, options, mappings, filename } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    
    // We expect the frontend to pass the parsed records rather than just emails, so we have full context.
    // However, if they pass just emails, we will map them to basic records.
    const records = req.body.records || emails.map((e: string) => ({ email: e }));
    const fName = filename || `upload_${Date.now()}.csv`;
    
    const jobId = await createJob(records, options, mappings || { emailKey: 'email' }, fName);
    
    res.json({ jobId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/status', async (req, res) => {
  const status = await getJobStatus(req.params.id);
  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(status);
});

router.post('/:id/cancel', async (req, res) => {
  await cancelJob(req.params.id);
  res.json({ success: true });
});

router.get('/:id/download', async (req, res) => {
  const jobId = req.params.id;
  const filterType = req.query.type as string || 'all'; // safe, risky, dangerous, usable, all
  
  const resultsPath = getJobResultsPath(jobId);
  if (!fs.existsSync(resultsPath)) {
    return res.status(404).json({ error: 'Results not found' });
  }

  res.setHeader('Content-Type', 'application/json');
  
  // To avoid memory limits on huge files, stream the JSONL and filter
  const fileStream = fs.createReadStream(resultsPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  const filteredRecords = [];
  
  for await (const line of rl) {
    try {
      const record = JSON.parse(line);
      
      if (filterType === 'all') {
        filteredRecords.push(record);
      } else if (filterType === 'safe' && record.verificationStatus === 'safe') {
        filteredRecords.push(record);
      } else if (filterType === 'risky' && (record.verificationStatus === 'risky' || record.verificationStatus === 'dangerous' || record.verificationStatus === 'usable')) {
        // "risky" filter usually maps to "Filtered Contacts" in our UI
        filteredRecords.push(record);
      } else if (filterType === record.verificationStatus) {
        filteredRecords.push(record);
      }
    } catch {}
  }
  
  res.json({ results: filteredRecords });
});

export default router;
