import React, { useState, useRef } from 'react';
import { processContacts } from '../utils/processor';
import { ContactData, ValidationRules, ProcessedContact } from '../types';

export function useLeadProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedContact[]>([]);
  const [eliminatedData, setEliminatedData] = useState<any[]>([]);

  const [logs, setLogs] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const runProcessor = async (
    data: ContactData[],
    mappings: any,
    rules: ValidationRules,
    fileName: string
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setEstimatedSeconds(null);
    setLogs('');
    
    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    try {
      // Stage 1: Normalize and dedupe locally
      const { preProcessedData, stats: localStats, eliminated: initialEliminated } = await processContacts(
        data, 
        mappings, 
        rules, 
        () => {},
        abortControllerRef.current.signal
      );
      
      // Stage 2: Submit Job to Backend Queue
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: preProcessedData,
          options: {
            excludeDisposable: rules.excludeDisposable,
            excludeRoleBased: rules.excludeRoleBased,
            excludeCatchAll: rules.excludeCatchAll,
            excludeSpamTraps: rules.excludeSpamTraps
          },
          mappings,
          filename: fileName
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to create background job');
      const { jobId: newJobId } = await response.json();
      setJobId(newJobId);

      // Polling Loop
      return new Promise<{ valid: any[], eliminated: any[], stats: any }>((resolve, reject) => {
        const pollInterval = setInterval(async () => {
          if (abortControllerRef.current?.signal.aborted) {
            clearInterval(pollInterval);
            reject(new Error('Pipeline Aborted'));
            return;
          }

          try {
            const statusRes = await fetch(`/api/jobs/${newJobId}/status`);
            const statusData = await statusRes.json();
            
            setProgress(statusData.progress || 0);
            setLogs(statusData.logs || '');
            
            if (statusData.progress > 2) {
              const elapsed = (Date.now() - startTime) / 1000;
              const totalEstimated = elapsed / (statusData.progress / 100);
              setEstimatedSeconds(Math.max(0, Math.round(totalEstimated - elapsed)));
            }

            if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'cancelled') {
              clearInterval(pollInterval);
              setIsProcessing(false);
              
              if (statusData.status === 'completed') {
                // Fetch results
                const safeRes = await fetch(`/api/jobs/${newJobId}/download?type=safe`);
                const safeData = await safeRes.json();
                
                const riskyRes = await fetch(`/api/jobs/${newJobId}/download?type=risky`);
                const riskyData = await riskyRes.json();

                const finalValid = safeData.results || [];
                const finalEliminated = [...initialEliminated, ...(riskyData.results || [])];
                
                setProcessedData(finalValid);
                setEliminatedData(finalEliminated);
                
                resolve({ 
                  valid: finalValid, 
                  eliminated: finalEliminated, 
                  stats: { ...localStats, finalDeliverable: finalValid.length, finalFiltered: finalEliminated.length } 
                });
              } else {
                reject(new Error(`Job ended with status: ${statusData.status}`));
              }
            }
          } catch (e) {
             console.error("Polling error", e);
          }
        }, 1000);
      });

    } catch (error: any) {
      if (error.message === 'Pipeline Aborted') {
        console.log('Processor cancelled by user.');
        return { valid: [], eliminated: [], stats: null };
      }
      console.error('Processing failed', error);
      throw error;
    }
  };

  const cancelProcessing = async () => {
    if (jobId) {
      await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
  };

  const resetProcessor = () => {
    setProcessedData([]);
    setEliminatedData([]);
    setProgress(0);
    setEstimatedSeconds(null);
  };

  return {
    isProcessing,
    progress,
    estimatedSeconds,
    processedData,
    eliminatedData,
    logs,
    jobId,
    runProcessor,
    cancelProcessing,
    resetProcessor,
    setProcessedData,
    setEliminatedData
  };
} 
