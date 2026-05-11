import { useState, useEffect } from 'react';
import { HistoryItem } from '../types';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('cleanflow_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveToHistory = (item: HistoryItem) => {
    setHistory(prev => {
      const updated = [item, ...prev].slice(0, 50);
      localStorage.setItem('cleanflow_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem('cleanflow_history');
    setHistory([]);
  };

  return { history, saveToHistory, clearHistory };
} 
