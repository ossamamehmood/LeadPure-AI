import React, { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LeadUpload } from './components/LeadUpload';
import { MappingSection } from './components/MappingSection';
import { RulesSection } from './components/RulesSection';
import { HistorySection } from './components/HistorySection';
import { ResultsDashboard } from './components/ResultsDashboard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DataPreviewModal } from './components/DataPreviewModal';
import { SingleValidation } from './components/SingleValidation';

// Hooks & Types
import { useHistory } from './hooks/useHistory';
import { useLeadProcessor } from './hooks/useLeadProcessor';
import { ContactData, HistoryItem, ValidationRules } from './types';

import { MobileNav } from './components/MobileNav';
import { useToast } from './components/Toast';

type AppState = 'upload' | 'mapping' | 'processing' | 'results' | 'rules' | 'history';

export default function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const toggleTheme = (event?: React.MouseEvent) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    
    if (!(document as any).startViewTransition || !event) {
      setTheme(nextTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 350,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [fileData, setFileData] = useState<ContactData[]>([]);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState({
    firstNameKey: '', lastNameKey: '', nameKey: '',
    emailKey: '', phoneKey: '', countryKey: '',
    cityKey: '', postalCodeKey: ''
  });
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ContactData[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');

  const [validationRules, setValidationRules] = useState<ValidationRules>({
    strictTitleCase: true, 
    forcePlusSign: true,
    excludeDisposable: true, 
    excludeRoleBased: true,
    excludeCatchAll: true,
    excludeSpamTraps: true
  });

  const { history, saveToHistory, clearHistory } = useHistory();
  const processor = useLeadProcessor();
  const { toast } = useToast();
  const [processingStats, setProcessingStats] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      
      const worker = new Worker(new URL('./workers/xlsxWorker.ts', import.meta.url), { type: 'module' });
      
      worker.onmessage = (event) => {
        setIsParsing(false);
        const { success, payload, error } = event.data;
        worker.terminate();

        if (!success) {
          toast(`PARSING_ERROR: ${error}`, 'error');
          return;
        }

        const filteredJson = payload;
        console.log(`[INGESTION] WORKER_COMPLETE: ${filteredJson.length} valid rows extracted.`);

        if (filteredJson.length > 0) {
          setFileData(filteredJson);
          const fileHeaders = Object.keys(filteredJson[0]);
          setHeaders(fileHeaders);
          
          setMappings({
            firstNameKey: fileHeaders.find(h => /first.*name|fname|f\.name/i.test(h)) || '',
            lastNameKey: fileHeaders.find(h => /last.*name|lname|l\.name/i.test(h)) || '',
            nameKey: fileHeaders.find(h => /full.*name|^name$|contact.*name/i.test(h)) || '',
            emailKey: fileHeaders.find(h => /email|e-mail|mail.*address/i.test(h)) || '',
            phoneKey: fileHeaders.find(h => /phone|cell|mobile|tel|contact.*number/i.test(h)) || '',
            countryKey: fileHeaders.find(h => /country|nation/i.test(h)) || '',
            cityKey: fileHeaders.find(h => /city|town|locality/i.test(h)) || '',
            postalCodeKey: fileHeaders.find(h => /zip|postal|pincode|post.*code/i.test(h)) || ''
          });
          setAppState('mapping');
          toast('PROTOCOL: IDENTITY INGESTION COMPLETE', 'success');
        } else {
          toast('PROTOCOL: NO DATA FOUND', 'error');
        }
      };

      worker.postMessage({ data });
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleStartProcessing = async () => {
    setAppState('processing');
    console.log(`[ENGINE] STARTING_SESSION: Roles[${validationRules.excludeRoleBased}] Disposable[${validationRules.excludeDisposable}] CatchAll[${validationRules.excludeCatchAll}]`);
    try {
      const { valid, eliminated, stats } = await processor.runProcessor(fileData, mappings, validationRules);
      setProcessingStats(stats);
      
      saveToHistory({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        fileName,
        totalRows: fileData.length,
        validRows: valid.length,
        processedData: valid,
        eliminatedData: eliminated,
        mappings,
        stats: {
          removed: eliminated.length,
          phoneFormatted: valid.length,
          avgConfidence: Math.round(valid.reduce((acc, curr) => acc + (curr.confidenceScore || 0), 0) / (valid.length || 1))
        }
      });
      
      setAppState('results');
      toast('0% BOUNCE VERIFICATION COMPLETE', 'success');
    } catch (error) {
      setAppState('mapping');
      toast('SYSTEM_ERROR: VALIDATION ENGINE FAILURE', 'error');
    }
  };

  const handleDownloadEliminated = (tier: 'all' | 'risky' | 'dangerous' = 'all') => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    const filteredData = tier === 'all' 
      ? processor.eliminatedData 
      : processor.eliminatedData.filter(item => item.status === tier);

    const exportData = filteredData.map(item => item.__originalData || item);

    if (exportData.length === 0) {
      toast(`NO ${tier.toUpperCase()} LEADS FOUND TO EXPORT`, 'info');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${tier === 'all' ? 'Filtered' : tier.charAt(0).toUpperCase() + tier.slice(1)} Leads`);
    
    XLSX.writeFile(workbook, `${baseName}_${tier === 'all' ? 'Filtered' : tier.charAt(0).toUpperCase() + tier.slice(1)}${extension}`);
    toast(`EXPORT COMPLETE: ${tier.toUpperCase()} NODES ARCHIVED`, 'info');
  };

  const handleDownload = () => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    // STRICT_COLUMN_INTEGRITY: Only export the exact original columns (but enhanced/cleaned)
    const exportData = processor.processedData.map(item => item.__enhancedData || item.__originalData || item);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Leads');
    
    XLSX.writeFile(workbook, `${baseName}_Cleaned${extension}`);
    toast('EXPORT COMPLETE: ORIGINAL STRUCTURE PRESERVED', 'success');
  };

  const openPreview = (data: ContactData[], title: string) => {
    setPreviewData(data);
    setPreviewTitle(title);
    setIsPreviewOpen(true);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    if (!item.processedData) return alert("Historical record format mismatch.");
    processor.setProcessedData(item.processedData);
    processor.setEliminatedData(item.eliminatedData);
    setMappings(item.mappings);
    setFileName(item.fileName);
    setAppState('results');
  };

  const downloadHistoryItem = (item: HistoryItem) => {
    if (!item.processedData) return toast("PROTOCOL_ERROR: DATA_MISMATCH", "error");
    
    const extension = item.fileName.substring(item.fileName.lastIndexOf('.')).toLowerCase();
    const baseName = item.fileName.substring(0, item.fileName.lastIndexOf('.')) || item.fileName;

    const exportData = item.processedData.map(p => p.__originalData || p);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Leads');
    
    XLSX.writeFile(workbook, `${baseName}_Cleaned${extension}`);
    toast('EXPORT COMPLETE: HISTORICAL LIST READY', 'success');
  };

  const reset = () => {
    setAppState('upload');
    setFileData([]);
    setFileName('');
    setHeaders([]);
    setMappings({
      firstNameKey: '', lastNameKey: '', nameKey: '',
      emailKey: '', phoneKey: '', countryKey: '',
      cityKey: '', postalCodeKey: ''
    });
    processor.resetProcessor();
    toast('PROTOCOL_PURGE: EMERGENCY RESET ENGAGED', 'success');
  };

  return (
    <div className="flex h-screen bg-app-bg text-app-text font-sans overflow-hidden relative selection:bg-brand-blue/30 selection:text-white" data-theme={theme}>
      {/* Premium Background Layering */}
      <div className="mesh-background" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(90,92,255,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[9999] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      <Sidebar currentTab={appState} setTab={setAppState} />

      <main className="flex-1 flex flex-col overflow-hidden pb-24 lg:pb-0 relative z-10">
        <Header 
          appState={appState} 
          isProcessing={processor.isProcessing} 
          onDownload={handleDownload} 
          onReset={reset} 
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <section className="flex-1 p-6 md:p-10 overflow-y-auto flex flex-col gap-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {appState === 'upload' && (
                <motion.div 
                  key="upload-state"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-20"
                >
                  <SingleValidation />
                  <LeadUpload onDrop={onDrop} />
                </motion.div>
              )}
              {appState === 'mapping' && (
                <motion.div 
                  key="mapping-state"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <MappingSection 
                    fileName={fileName} totalLeads={fileData.length} headers={headers} 
                    mappings={mappings} setMappings={setMappings} 
                    onStartProcessing={handleStartProcessing} isProcessing={processor.isProcessing} 
                    onPreview={() => openPreview(fileData, 'Original Data Preview')}
                  />
                </motion.div>
              )}
              {appState === 'rules' && (
                <motion.div 
                  key="rules-state"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <RulesSection 
                    rules={validationRules} 
                    onToggle={(key) => setValidationRules(p => ({ ...p, [key]: !p[key]}))} 
                  />
                </motion.div>
              )}
              {appState === 'history' && (
                <motion.div 
                  key="history-state"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <HistorySection 
                    history={history} loadItem={loadHistoryItem} 
                    downloadItem={downloadHistoryItem} clearHistory={clearHistory} 
                  />
                </motion.div>
              )}
              {appState === 'results' && (
                <motion.div 
                  key="results-state"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ResultsDashboard 
                    processedData={processor.processedData} 
                    eliminatedData={processor.eliminatedData} 
                    mappings={mappings} 
                    onPreview={openPreview}
                    onDownloadEliminated={handleDownloadEliminated}
                    onDownloadValid={handleDownload}
                    stats={processingStats}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-20">
              <Footer />
            </div>
          </div>
        </section>

        <MobileNav currentTab={appState} setTab={setAppState} />
      </main>

      <AnimatePresence>
        {isParsing && (
          <LoadingOverlay 
            key="parsing-overlay"
            progress={10} 
            estimatedSeconds={1} 
            customText="PARSING DATA FILE..." 
            customDescription="Extracting and normalizing identities off-thread..." 
          />
        )}
        {appState === 'processing' && (
          <LoadingOverlay 
            key="processing-overlay"
            progress={processor.progress} 
            estimatedSeconds={processor.estimatedSeconds} 
            onCancel={processor.cancelProcessing} 
            logs={processor.logs}
          />
        )}
      </AnimatePresence>

      <DataPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        data={previewData} 
        title={previewTitle} 
      />
    </div>
  );
}