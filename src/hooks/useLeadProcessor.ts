import { useState } from 'react';
import { processContacts } from '../utils/processor';
import { ContactData, ValidationRules, ProcessedContact } from '../types';

export function useLeadProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedContact[]>([]);
  const [eliminatedData, setEliminatedData] = useState<any[]>([]);

  const runProcessor = async (
    data: ContactData[],
    mappings: any,
    rules: ValidationRules
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setEstimatedSeconds(null);
    
    const startTime = Date.now();

    try {
      const { valid, eliminated } = await processContacts(data, mappings, rules, (p) => {
        setProgress(p);
        if (p > 2) {
          const elapsed = (Date.now() - startTime) / 1000;
          const totalEstimated = elapsed / (p / 100);
          setEstimatedSeconds(Math.max(0, Math.round(totalEstimated - elapsed)));
        }
      });
      
      setProcessedData(valid);
      setEliminatedData(eliminated);
      return { valid, eliminated };
    } catch (error) {
      console.error('Processing failed', error);
      throw error;
    } finally {
      setIsProcessing(false);
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
    resetProcessor,
    setProcessedData,
    setEliminatedData
  };
}