import * as XLSX from 'xlsx';

const MAX_ROWS = 5000;
const CHUNK_SIZE = 500;

self.onmessage = async (e: MessageEvent) => {
  try {
    const { data } = e.data;
    self.postMessage({ type: 'progress', progress: 15 });

    const workbook = XLSX.read(data, {
      type: 'array',
      cellDates: true,
      cellText: true,
      cellFormula: false,
      cellHTML: false
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawJson = XLSX.utils.sheet_to_json<any>(worksheet, {
      defval: '',
      blankrows: false,
      raw: false
    });

    if (rawJson.length > MAX_ROWS) {
      self.postMessage({
        type: 'done',
        success: false,
        error: `List contains ${rawJson.length.toLocaleString()} rows. Maximum supported list size is ${MAX_ROWS.toLocaleString()} rows per scan.`
      });
      return;
    }

    const filteredJson: any[] = [];
    const total = rawJson.length;

    // Normalize in 500-row chunks, yielding to the worker event loop between chunks
    for (let start = 0; start < total; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE, total);
      for (let i = start; i < end; i++) {
        const row = rawJson[i];
        const normalizedRow: any = {};
        let hasValue = false;
        for (const [key, value] of Object.entries(row)) {
          const cleanKey = key.trim().replace(/\s+/g, ' ');
          const cleanValue = String(value || '')
            .trim()
            .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');
          normalizedRow[cleanKey] = cleanValue;
          if (cleanValue !== '') hasValue = true;
        }
        if (hasValue) filteredJson.push(normalizedRow);
      }
      const pct = 20 + Math.round((end / Math.max(1, total)) * 75);
      self.postMessage({ type: 'progress', progress: pct });
      await new Promise((r) => setTimeout(r, 0));
    }

    self.postMessage({ type: 'done', success: true, payload: filteredJson });
  } catch (error: any) {
    self.postMessage({ type: 'done', success: false, error: error.message || 'Failed to parse file' });
  }
};
