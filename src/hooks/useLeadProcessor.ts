import React, { useState, useRef } from 'react';
import { processContacts } from '../utils/processor';
import { ContactData, ValidationRules, ProcessedContact } from '../types';

export function useLeadProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedContact[]>([]);
  const [eliminatedData, setEliminatedData] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const runProcessor = async (
    data: ContactData[],
    mappings: any,
    rules: ValidationRules
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setEstimatedSeconds(null);
    setLogs([]);
    
    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    try {
      const { valid, eliminated, stats } = await processContacts(
        data, 
        mappings, 
        rules, 
        (p, logMsg) => {
          setProgress(p);
          if (logMsg) {
            setLogs(prev => {
              const newLogs = [...prev, logMsg];
              return newLogs.slice(-20); // Keep last 20 logs in memory
            });
          }
          if (p > 2) {
            const elapsed = (Date.now() - startTime) / 1000;
            const totalEstimated = elapsed / (p / 100);
            setEstimatedSeconds(Math.max(0, Math.round(totalEstimated - elapsed)));
          }
        },
        abortControllerRef.current.signal
      );
      
      setProcessedData(valid);
      setEliminatedData(eliminated);
      return { valid, eliminated, stats };
    } catch (error: any) {
      if (error.message === 'Pipeline Aborted') {
        console.log('Processor cancelled by user.');
        return { valid: [], eliminated: [], stats: null };
      }
      console.error('Processing failed', error);
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
    setEstimatedSeconds(null);
  };

  return {
    isProcessing,
    progress,
    estimatedSeconds,
    processedData,
    eliminatedData,
    runProcessor,
    cancelProcessing,
    resetProcessor,
    setProcessedData,
    setEliminatedData,
    logs
  };
} 
