import * as XLSX from 'xlsx';

self.onmessage = (e: MessageEvent) => {
  try {
    const { data } = e.data;
    
    // Optimized for large datasets by disabling unnecessary features
    const workbook = XLSX.read(data, { 
      type: 'array',
      cellDates: true,
      cellText: true,
      cellFormula: false,
      cellHTML: false
    });
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawJson = XLSX.utils.sheet_to_json<any>(worksheet, { 
      defval: "",
      blankrows: false,
      raw: false
    });

    // Deep Normalization: Sanitize headers and values for 100% deterministic mapping
    const json = rawJson.map(row => {
      const normalizedRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        // Normalize header key
        const cleanKey = key.trim().replace(/\s+/g, ' ');
        // Normalize value
        let cleanValue = String(value || '').trim();
        // Remove non-printable/hidden characters
        cleanValue = cleanValue.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");
        normalizedRow[cleanKey] = cleanValue;
      }
      return normalizedRow;
    });

    // Aggressive filtering: Only keep rows that have at least one non-empty value
    const filteredJson = json.filter((row) => {
      const values = Object.values(row).filter(v => v !== "");
      return values.length > 0;
    });

    self.postMessage({ success: true, payload: filteredJson });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
