import { useState, useEffect } from 'react';
import { HistoryItem } from '../types';

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('lead_pure_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveToHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history].slice(0, 50); // Keep last 50
    setHistory(newHistory);
    localStorage.setItem('lead_pure_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('lead_pure_history');
  };

  return { history, saveToHistory, clearHistory };
}; 
