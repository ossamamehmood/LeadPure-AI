import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { MotionConfig, motion, AnimatePresence } from 'motion/react';
import { Play, X } from 'lucide-react';

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
import { GlossyCard } from './components/ui/GlossyCard';

// Hooks & Types
import { useHistory } from './hooks/useHistory';
import { useLeadProcessor } from './hooks/useLeadProcessor';
import { loadSavedScanState, clearSavedScanState, SavedScanState } from './utils/processor';
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
    const transition = (document as any).startViewTransition(() => setTheme(nextTheme));
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 350, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [fileData, setFileData] = useState<ContactData[]>([]);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState(10);
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
  const [resumableScan, setResumableScan] = useState<SavedScanState | null>(null);

  useEffect(() => {
    const saved = loadSavedScanState();
    if (saved) setResumableScan(saved);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setParsingProgress(10);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const worker = new Worker(new URL('./workers/xlsxWorker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (event) => {
        const msg = event.data;
        if (msg.type === 'progress') {
          setParsingProgress(msg.progress || 25);
          return;
        }

        setIsParsing(false);
        worker.terminate();

        if (!msg.success) {
          toast(`Parsing error: ${msg.error}`, 'error');
          return;
        }

        const filteredJson = msg.payload || [];
        if (filteredJson.length > 0) {
          setFileData(filteredJson);
          const fileHeaders = Object.keys(filteredJson[0]);
          setHeaders(fileHeaders);

          setMappings({
            firstNameKey: fileHeaders.find((h) => /first.*name|fname|f\.name/i.test(h)) || '',
            lastNameKey: fileHeaders.find((h) => /last.*name|lname|l\.name/i.test(h)) || '',
            nameKey: fileHeaders.find((h) => /full.*name|^name$|contact.*name/i.test(h)) || '',
            emailKey: fileHeaders.find((h) => /email|e-mail|mail.*address/i.test(h)) || '',
            phoneKey: fileHeaders.find((h) => /phone|cell|mobile|tel|contact.*number/i.test(h)) || '',
            countryKey: fileHeaders.find((h) => /country|nation/i.test(h)) || '',
            cityKey: fileHeaders.find((h) => /city|town|locality/i.test(h)) || '',
            postalCodeKey: fileHeaders.find((h) => /zip|postal|pincode|post.*code/i.test(h)) || ''
          });
          setAppState('mapping');
          toast(`Loaded ${filteredJson.length} rows ready for mapping`, 'success');
        } else {
          toast('No valid rows found in spreadsheet', 'error');
        }
      };

      worker.postMessage({ data });
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const finishScanState = (valid: any[], eliminated: any[], stats: any, timedOut: boolean, usedMappings: any, usedName: string) => {
    setProcessingStats(stats);
    setResumableScan(null);

    if (stats && stats.arrivedCount > 0) {
      saveToHistory({
        id: Math.random().toString(36).slice(2, 11),
        date: new Date().toISOString(),
        fileName: usedName || 'LeadPure_Scan.xlsx',
        totalRows: stats.totalInput || (valid.length + eliminated.length),
        validRows: valid.length,
        processedData: valid,
        eliminatedData: eliminated.filter((item: any) => !item.isTimedOutMissing),
        mappings: usedMappings,
        stats: {
          removed: eliminated.filter((item: any) => !item.isTimedOutMissing).length,
          phoneFormatted: valid.length,
          avgConfidence: stats.definitiveRate || 0
        }
      });
    }

    setAppState('results');
    if (timedOut) {
      toast('Scan hit 20-minute limit - arrived results saved, missing rows marked timed out.', 'info');
    } else {
      toast('Verification complete', 'success');
    }
  };

  const handleStartProcessing = async () => {
    setAppState('processing');
    try {
      const result = await processor.runProcessor(fileData, mappings, validationRules, fileName);
      if (result.stats) {
        finishScanState(result.valid, result.eliminated, result.stats, !!result.timedOut, mappings, fileName);
      } else {
        setAppState('mapping');
        toast('Verification cancelled', 'info');
      }
    } catch (error: any) {
      setAppState('mapping');
      toast(`Verification error: ${error.message || 'Backend unavailable'}`, 'error');
    }
  };

  const handleResumeScan = async () => {
    if (!resumableScan) return;
    setFileName(resumableScan.fileName || 'Resumed_Scan.csv');
    setMappings(resumableScan.mappings);
    setAppState('processing');
    try {
      const result = await processor.resumeProcessor(resumableScan);
      if (result.stats) {
        finishScanState(result.valid, result.eliminated, result.stats, !!result.timedOut, resumableScan.mappings, resumableScan.fileName);
      } else {
        setAppState('upload');
      }
    } catch (error: any) {
      setAppState('upload');
      toast(`Resume failed: ${error.message || 'Unable to fetch manifest'}`, 'error');
    }
  };

  const dismissResumable = () => {
    clearSavedScanState();
    setResumableScan(null);
  };

  const formatExportRow = (item: any) => {
    const base = item.__originalData || item;
    return {
      ...base,
      Verdict: item.status || 'UNKNOWN',
      Reason: item.verificationReason || item.reason || '',
      MX_Record: item.mxRecord || '',
      SMTP_Connected: item.smtpValid ? 'Yes' : 'No',
      Catch_All: item.isCatchAll ? 'Yes' : 'No',
      Disposable: item.isDisposable ? 'Yes' : 'No',
      Role_Based: item.isRoleBased ? 'Yes' : 'No'
    };
  };

  const dateSlug = () => new Date().toISOString().slice(0, 10);

  // Unified export matching the exact verdicts displayed on the page (arrived engine results ONLY)
  const handleDownloadAll = () => {
    const allArrived = [
      ...(processor.processedData || []),
      ...(processor.eliminatedData || []).filter((item: any) => !item.isTimedOutMissing)
    ].sort((a: any, b: any) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));

    const exportData = allArrived.map(formatExportRow);
    if (exportData.length === 0) {
      toast('No arrived engine results available to export yet', 'info');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verification Results');
    XLSX.writeFile(workbook, `LeadPure_Results_${dateSlug()}.xlsx`);
    toast(`Exported ${exportData.length} verified records`, 'success');
  };

  const handleDownloadValid = () => {
    const exportData = (processor.processedData || [])
      .filter((item: any) => !item.isTimedOutMissing)
      .map(formatExportRow);

    if (exportData.length === 0) {
      toast('No SAFE records available to export', 'info');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SAFE Leads');
    XLSX.writeFile(workbook, `LeadPure_SAFE_${dateSlug()}.xlsx`);
    toast(`Exported ${exportData.length} SAFE records`, 'success');
  };

  const handleDownloadEliminated = (tier: 'all' | 'risky' | 'invalid' | 'unknown' = 'all') => {
    const arrivedEliminated = (processor.eliminatedData || []).filter((item: any) => !item.isTimedOutMissing);
    const filteredData = tier === 'all'
      ? arrivedEliminated
      : arrivedEliminated.filter((item) => String(item.status || '').toUpperCase() === tier.toUpperCase());

    const exportData = filteredData.map(formatExportRow);
    if (exportData.length === 0) {
      toast(`No ${tier.toUpperCase()} records available to export`, 'info');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Results');
    XLSX.writeFile(workbook, `LeadPure_Filtered_${dateSlug()}.xlsx`);
    toast(`Exported ${exportData.length} filtered records`, 'info');
  };

  const openPreview = (data: ContactData[], title: string) => {
    setPreviewData(data);
    setPreviewTitle(title);
    setIsPreviewOpen(true);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    if (!item.processedData) return;
    processor.setProcessedData(item.processedData);
    processor.setEliminatedData(item.eliminatedData || []);
    setMappings(item.mappings);
    setFileName(item.fileName);
    setAppState('results');
  };

  const downloadHistoryItem = (item: HistoryItem) => {
    const allArrived = [
      ...(item.processedData || []),
      ...(item.eliminatedData || []).filter((r: any) => !r.isTimedOutMissing)
    ].sort((a: any, b: any) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));

    const exportData = allArrived.map(formatExportRow);
    if (!exportData.length) {
      toast('No results in archive entry', 'info');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verification Results');
    XLSX.writeFile(workbook, `LeadPure_Results_${dateSlug()}.xlsx`);
    toast('Archived results exported', 'success');
  };

  const reset = () => {
    if (processor.isProcessing) processor.cancelProcessing();
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
    toast('Session reset', 'info');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-[100dvh] lg:h-screen bg-app-bg text-app-text font-sans overflow-hidden relative selection:bg-brand-blue/30 selection:text-white" data-theme={theme}>
      <div className="mesh-background" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(90,92,255,0.05),transparent_50%)] pointer-events-none" />

      <Sidebar currentTab={appState} setTab={setAppState} />

      <main className="flex-1 flex flex-col overflow-hidden pb-20 lg:pb-0 relative z-10 min-w-0">
        <Header
          appState={appState}
          isProcessing={processor.isProcessing}
          onDownload={handleDownloadAll}
          onReset={reset}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <section className="flex-1 px-4 py-6 sm:p-8 md:p-10 overflow-y-auto flex flex-col gap-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            <AnimatePresence mode="wait">
              {appState === 'upload' && (
                <motion.div
                  key="upload-state"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-12 sm:space-y-16"
                >
                  {resumableScan && (
                    <GlossyCard glow="blue" className="p-5 sm:p-6 rounded-3xl border border-brand-blue/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-brand-blue uppercase tracking-wider">Unfinished Scan Found</p>
                        <h4 className="text-sm sm:text-base font-display font-bold text-app-text mt-1">
                          {resumableScan.fileName} ({resumableScan.totalRows} emails)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                          Started {new Date(resumableScan.startedAt).toLocaleString()} &bull; Ref: {resumableScan.requestId}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={handleResumeScan}
                          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Resume Last Scan
                        </button>
                        <button
                          onClick={dismissResumable}
                          aria-label="Dismiss unfinished scan banner"
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-app-text cursor-pointer"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </GlossyCard>
                  )}

                  <SingleValidation />
                  <LeadUpload onDrop={onDrop} />
                </motion.div>
              )}

              {appState === 'mapping' && (
                <motion.div
                  key="mapping-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <MappingSection
                    fileName={fileName}
                    totalLeads={fileData.length}
                    headers={headers}
                    mappings={mappings}
                    setMappings={setMappings}
                    onStartProcessing={handleStartProcessing}
                    isProcessing={processor.isProcessing}
                    onPreview={() => openPreview(fileData, 'Source File Preview')}
                  />
                </motion.div>
              )}

              {appState === 'rules' && (
                <motion.div
                  key="rules-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <RulesSection
                    rules={validationRules}
                    onToggle={(key) => setValidationRules((p) => ({ ...p, [key]: !p[key] }))}
                  />
                </motion.div>
              )}

              {appState === 'history' && (
                <motion.div
                  key="history-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HistorySection
                    history={history}
                    loadItem={loadHistoryItem}
                    downloadItem={downloadHistoryItem}
                    clearHistory={clearHistory}
                  />
                </motion.div>
              )}

              {(appState === 'results' || appState === 'processing') && (
                <motion.div
                  key="results-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ResultsDashboard
                    processedData={processor.processedData}
                    eliminatedData={processor.eliminatedData}
                    mappings={mappings}
                    onPreview={openPreview}
                    onDownloadEliminated={handleDownloadEliminated}
                    onDownloadValid={handleDownloadValid}
                    onDownloadAll={handleDownloadAll}
                    stats={processingStats}
                    isProcessing={processor.isProcessing}
                    progress={processor.progress}
                    emailsDone={processor.emailsDone}
                    emailsTotal={processor.emailsTotal}
                    chunksDone={processor.chunksDone}
                    chunksTotal={processor.chunksTotal}
                    estimatedSeconds={processor.estimatedSeconds}
                    activeRequestId={processor.activeRequestId}
                    onCancel={processor.cancelProcessing}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-16">
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
            progress={parsingProgress}
            estimatedSeconds={1}
            customText="Reading Your Spreadsheet..."
            customDescription="Loading contacts smoothly in your browser without slowing down the page."
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
    </MotionConfig>
  );
}
