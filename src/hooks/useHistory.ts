import { useState, useEffect, useCallback } from 'react';
import { HistoryItem } from '../types';

const STORAGE_KEY = 'lead_pure_history';

function readStoredHistory(): HistoryItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse history', e);
  }
  return [];
}

function persistHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Unable to persist history', e);
  }
}

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>(() => readStoredHistory());

  useEffect(() => {
    setHistory(readStoredHistory());
  }, []);

  const saveToHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const filtered = item.requestId
        ? prev.filter((existing) => existing.requestId !== item.requestId && existing.id !== item.id)
        : prev.filter((existing) => existing.id !== item.id);
      const next = [item, ...filtered].slice(0, 50);
      persistHistory(next);
      return next;
    });
  }, []);

  const updateHistoryItem = useCallback((id: string, updater: (prev: HistoryItem) => HistoryItem) => {
    setHistory((prev) => {
      const next = prev.map((item) => (item.id === id ? updater(item) : item));
      persistHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { history, saveToHistory, updateHistoryItem, clearHistory };
};
