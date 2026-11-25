import { useState, useRef } from 'react';
import { processContacts, BulkProgressUpdate, SavedScanState } from '../utils/processor';
import { ContactData, ValidationRules, ProcessedContact } from '../types';

export function useLeadProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [emailsDone, setEmailsDone] = useState(0);
  const [emailsTotal, setEmailsTotal] = useState(0);
  const [chunksDone, setChunksDone] = useState(0);
  const [chunksTotal, setChunksTotal] = useState(0);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedContact[]>([]);
  const [eliminatedData, setEliminatedData] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleUpdate = (u: BulkProgressUpdate) => {
    setProgress(u.progress);
    if (typeof u.emailsDone === 'number') setEmailsDone(u.emailsDone);
    if (typeof u.emailsTotal === 'number') setEmailsTotal(u.emailsTotal);
    if (typeof u.chunksDone === 'number') setChunksDone(u.chunksDone);
    if (typeof u.chunksTotal === 'number') setChunksTotal(u.chunksTotal);
    if (u.requestId) setActiveRequestId(u.requestId);
    if (u.etaSeconds !== undefined) setEstimatedSeconds(u.etaSeconds);
    if (u.validSnapshot) setProcessedData(u.validSnapshot);
    if (u.eliminatedSnapshot) setEliminatedData(u.eliminatedSnapshot);
    if (u.logMessage) {
      setLogs((prev) => [...prev, u.logMessage!].slice(-25));
    }
  };

  const runProcessor = async (
    data: ContactData[],
    mappings: any,
    rules: ValidationRules,
    fileName?: string
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setEmailsDone(0);
    setEmailsTotal(data.length);
    setChunksDone(0);
    setChunksTotal(Math.ceil(data.length / 100));
    setActiveRequestId(null);
    setEstimatedSeconds(null);
    setProcessedData([]);
    setEliminatedData([]);
    setLogs([]);

    abortControllerRef.current = new AbortController();

    try {
      const result = await processContacts(
        data,
        mappings,
        rules,
        handleUpdate,
        abortControllerRef.current.signal,
        undefined,
        fileName
      );

      setProcessedData(result.valid);
      setEliminatedData(result.eliminated);
      if (result.requestId) setActiveRequestId(result.requestId);
      return result;
    } catch (error: any) {
      if (error.message === 'Pipeline Aborted') {
        return { valid: [], eliminated: [], stats: null, timedOut: false };
      }
      console.error('Processing failed', error);
      throw error;
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const resumeProcessor = async (saved: SavedScanState) => {
    const rows = saved.rows && saved.rows.length > 0
      ? saved.rows
      : saved.emails.map((email) => ({ [saved.mappings.emailKey || 'email']: email }));

    setIsProcessing(true);
    setProgress(5);
    setEmailsDone(0);
    setEmailsTotal(saved.totalRows);
    setChunksDone(0);
    setChunksTotal(Math.ceil(saved.totalRows / 100));
    setActiveRequestId(saved.requestId);
    setEstimatedSeconds(null);
    setProcessedData([]);
    setEliminatedData([]);
    setLogs([`Resuming scan ${saved.requestId}...`]);

    abortControllerRef.current = new AbortController();

    try {
      const result = await processContacts(
        rows,
        saved.mappings,
        saved.rules,
        handleUpdate,
        abortControllerRef.current.signal,
        { requestId: saved.requestId, fileName: saved.fileName }
      );

      setProcessedData(result.valid);
      setEliminatedData(result.eliminated);
      return result;
    } catch (error: any) {
      if (error.message === 'Pipeline Aborted') {
        return { valid: [], eliminated: [], stats: null, timedOut: false };
      }
      console.error('Resume failed', error);
      throw error;
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const resetProcessor = () => {
    setProcessedData([]);
    setEliminatedData([]);
    setProgress(0);
    setEmailsDone(0);
    setEmailsTotal(0);
    setChunksDone(0);
    setChunksTotal(0);
    setActiveRequestId(null);
    setEstimatedSeconds(null);
    setLogs([]);
  };

  return {
    isProcessing,
    progress,
    emailsDone,
    emailsTotal,
    chunksDone,
    chunksTotal,
    activeRequestId,
    estimatedSeconds,
    processedData,
    eliminatedData,
    runProcessor,
    resumeProcessor,
    cancelProcessing,
    resetProcessor,
    setProcessedData,
    setEliminatedData,
    logs
  };
}
