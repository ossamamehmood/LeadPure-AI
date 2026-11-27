import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { MotionConfig, motion, AnimatePresence } from 'motion/react';
import { Play, X } from 'lucide-react';

// Core Shell & Landing Components (kept in initial entry for instant `/` paint)
import { Footer, AppRoutePath } from './components/Footer';
import { GlossyCard } from './components/ui/GlossyCard';
import { MagneticButton } from './components/ui/MagneticButton';
import { BackgroundMotion } from './components/ui/BackgroundMotion';
import { LiquidGlassFilter } from './components/ui/LiquidGlassFilter';
import { SiteShell } from './components/layout/SiteShell';
import { LandingPage } from './components/LandingPage';

// Code-split subpages and workspace views for fast Landing Core Web Vitals
const Sidebar = lazy(() => import('./components/Sidebar').then((m) => ({ default: m.Sidebar })));
const Header = lazy(() => import('./components/Header').then((m) => ({ default: m.Header })));
const MobileNav = lazy(() => import('./components/MobileNav').then((m) => ({ default: m.MobileNav })));
const SingleValidation = lazy(() => import('./components/SingleValidation').then((m) => ({ default: m.SingleValidation })));
const LeadUpload = lazy(() => import('./components/LeadUpload').then((m) => ({ default: m.LeadUpload })));
const MappingSection = lazy(() => import('./components/MappingSection').then((m) => ({ default: m.MappingSection })));
const RulesSection = lazy(() => import('./components/RulesSection').then((m) => ({ default: m.RulesSection })));
const HistorySection = lazy(() => import('./components/HistorySection').then((m) => ({ default: m.HistorySection })));
const ResultsDashboard = lazy(() => import('./components/ResultsDashboard').then((m) => ({ default: m.ResultsDashboard })));
const LoadingOverlay = lazy(() => import('./components/LoadingOverlay').then((m) => ({ default: m.LoadingOverlay })));
const DataPreviewModal = lazy(() => import('./components/DataPreviewModal').then((m) => ({ default: m.DataPreviewModal })));
const PlansPage = lazy(() => import('./components/pages/PlansPage').then((m) => ({ default: m.PlansPage })));
const DeliverabilityPage = lazy(() => import('./components/pages/DeliverabilityPage').then((m) => ({ default: m.DeliverabilityPage })));
const PrivacyPage = lazy(() => import('./components/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./components/pages/TermsPage').then((m) => ({ default: m.TermsPage })));

// Hooks & Types
import { useHistory } from './hooks/useHistory';
import { useLeadProcessor } from './hooks/useLeadProcessor';
import { loadSavedScanState, clearSavedScanState, SavedScanState } from './utils/processor';
import { ContactData, HistoryItem, ValidationRules } from './types';

import { useToast } from './components/Toast';

type AppState = 'upload' | 'mapping' | 'processing' | 'results' | 'rules' | 'history';

function getRouteFromLocation(): AppRoutePath {
  if (typeof window === 'undefined') return '/';
  const p = window.location.pathname.toLowerCase();
  if (p.startsWith('/dashboard')) return '/dashboard';
  if (p.startsWith('/pricing')) return '/pricing';
  if (p.startsWith('/deliverability')) return '/deliverability';
  if (p.startsWith('/privacy')) return '/privacy';
  if (p.startsWith('/terms')) return '/terms';
  return '/';
}

export default function App() {
  const [route, setRoute] = useState<AppRoutePath>(() => getRouteFromLocation());
  const [appState, setAppState] = useState<AppState>('upload');
  const [prefillEmail, setPrefillEmail] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('leadpure_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const onPopState = () => setRoute(getRouteFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const ROUTE_SEO: Record<AppRoutePath, { title: string; description: string }> = {
      '/': {
        title: 'LeadPure | Email Verification & List Hygiene',
        description: 'Verify every inbox before you hit send. Real-time verification and local spreadsheet cleanup up to 5,000 contacts.',
      },
      '/dashboard': {
        title: 'Workspace | LeadPure',
        description: 'Check single email addresses live or upload spreadsheets to verify leads and clean formatting locally in your browser.',
      },
      '/deliverability': {
        title: 'Deliverability Guide | LeadPure',
        description: 'How LeadPure keeps outreach bounce rates under 1% with double-checked rejections and honest risky-domain labels.',
      },
      '/pricing': {
        title: 'Plans & Access | LeadPure',
        description: 'Start verifying individual emails and cleaning outreach lists free with zero credit fees.',
      },
      '/privacy': {
        title: 'Privacy Policy | LeadPure',
        description: 'Your contact names, phone numbers, and spreadsheet columns stay strictly inside your browser.',
      },
      '/terms': {
        title: 'Terms of Service | LeadPure',
        description: 'Clear, fair terms for verifying business and outreach email lists with LeadPure.',
      },
    };
    const meta = ROUTE_SEO[route] || ROUTE_SEO['/'];
    document.title = meta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', meta.description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);
    if (typeof window !== 'undefined') {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `${window.location.origin}${route === '/' ? '/' : route}`;
    }
  }, [route]);

  const navigate = useCallback((target: AppRoutePath) => {
    if (getRouteFromLocation() !== target) {
      window.history.pushState({}, '', target);
    }
    setRoute(target);
    window.scrollTo({ top: 0 });
  }, []);

  const applyThemeDom = (nextTheme: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('leadpure_theme', nextTheme);
    } catch {
      // ignore storage quota restrictions
    }
  };

  const toggleTheme = (event?: React.MouseEvent) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!(document as any).startViewTransition || !event || reduceMotion) {
      applyThemeDom(nextTheme);
      setTheme(nextTheme);
      return;
    }
    const x = event.clientX || window.innerWidth / 2;
    const y = event.clientY || 40;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const transition = (document as any).startViewTransition(() => {
      applyThemeDom(nextTheme);
      setTheme(nextTheme);
    });
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
          { duration: 350, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
        );
      })
      .catch(() => {});
  };

  useEffect(() => {
    applyThemeDom(theme);
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

  /** Dynamically imports SheetJS only when the user exports a spreadsheet. */
  const exportRowsToXlsx = async (rows: Record<string, unknown>[], sheetName: string, fileName: string) => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  };

  // Unified export matching the exact verdicts displayed on the page (arrived engine results ONLY)
  const handleDownloadAll = async () => {
    const allArrived = [
      ...(processor.processedData || []),
      ...(processor.eliminatedData || []).filter((item: any) => !item.isTimedOutMissing)
    ].sort((a: any, b: any) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));

    const exportData = allArrived.map(formatExportRow);
    if (exportData.length === 0) {
      toast('No arrived engine results available to export yet', 'info');
      return;
    }

    await exportRowsToXlsx(exportData, 'Verification Results', `LeadPure_Results_${dateSlug()}.xlsx`);
    toast(`Exported ${exportData.length} verified records`, 'success');
  };

  const handleDownloadValid = async () => {
    const exportData = (processor.processedData || [])
      .filter((item: any) => !item.isTimedOutMissing)
      .map(formatExportRow);

    if (exportData.length === 0) {
      toast('No SAFE records available to export', 'info');
      return;
    }

    await exportRowsToXlsx(exportData, 'SAFE Leads', `LeadPure_SAFE_${dateSlug()}.xlsx`);
    toast(`Exported ${exportData.length} SAFE records`, 'success');
  };

  const handleDownloadEliminated = async (tier: 'all' | 'risky' | 'invalid' | 'unknown' = 'all') => {
    const arrivedEliminated = (processor.eliminatedData || []).filter((item: any) => !item.isTimedOutMissing);
    const filteredData = tier === 'all'
      ? arrivedEliminated
      : arrivedEliminated.filter((item) => String(item.status || '').toUpperCase() === tier.toUpperCase());

    const exportData = filteredData.map(formatExportRow);
    if (exportData.length === 0) {
      toast(`No ${tier.toUpperCase()} records available to export`, 'info');
      return;
    }

    await exportRowsToXlsx(exportData, 'Filtered Results', `LeadPure_Filtered_${dateSlug()}.xlsx`);
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

  const downloadHistoryItem = async (item: HistoryItem) => {
    const allArrived = [
      ...(item.processedData || []),
      ...(item.eliminatedData || []).filter((r: any) => !r.isTimedOutMissing)
    ].sort((a: any, b: any) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));

    const exportData = allArrived.map(formatExportRow);
    if (!exportData.length) {
      toast('No results in archive entry', 'info');
      return;
    }

    await exportRowsToXlsx(exportData, 'Verification Results', `LeadPure_Results_${dateSlug()}.xlsx`);
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

  if (route !== '/dashboard') {
    return (
      <MotionConfig reducedMotion="user">
        <LiquidGlassFilter />
        <SiteShell
          activeRoute={route}
          onNavigate={navigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        >
          <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
            {route === '/' && (
              <LandingPage
                onOpenDashboard={(email?: string) => {
                  if (typeof email === 'string' && email.trim()) {
                    setPrefillEmail(email.trim());
                  }
                  setAppState('upload');
                  navigate('/dashboard');
                }}
                onNavigate={navigate}
                theme={theme}
              />
            )}
            {route === '/pricing' && <PlansPage onNavigate={navigate} />}
            {route === '/deliverability' && <DeliverabilityPage onNavigate={navigate} />}
            {route === '/privacy' && <PrivacyPage onNavigate={navigate} />}
            {route === '/terms' && <TermsPage onNavigate={navigate} />}
          </Suspense>
        </SiteShell>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <LiquidGlassFilter />
      <div className="flex min-h-[100dvh] lg:h-screen bg-app-bg text-app-text font-sans overflow-hidden relative selection:bg-brand-blue/30 selection:text-white" data-theme={theme}>
      <a
        href="#workspace-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[90] px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        Skip to workspace
      </a>
      <BackgroundMotion variant="ambient" />

      <Suspense fallback={null}>
        <Sidebar currentTab={appState} setTab={setAppState} onNavigateHome={() => navigate('/')} />
      </Suspense>

      <main id="workspace-main" className="flex-1 flex flex-col overflow-hidden pb-24 lg:pb-0 relative z-10 min-w-0">
        <Suspense fallback={<div className="h-20" />}>
          <Header
            appState={appState}
            isProcessing={processor.isProcessing}
            onDownload={handleDownloadAll}
            onReset={reset}
            theme={theme}
            onToggleTheme={toggleTheme}
            onNavigateHome={() => navigate('/')}
          />
        </Suspense>

        <section className="flex-1 px-4 py-6 sm:p-8 md:p-10 overflow-y-auto flex flex-col gap-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            <Suspense fallback={<div className="min-h-[50vh]" aria-busy="true" />}>
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
                        <MagneticButton
                          onClick={handleResumeScan}
                          variant="primary"
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Resume Last Scan
                        </MagneticButton>
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

                  <SingleValidation
                    initialEmail={prefillEmail}
                    onConsumeInitialEmail={() => setPrefillEmail('')}
                  />
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
            </Suspense>

            <div className="mt-16">
              <Footer variant="dashboard" onNavigate={navigate} />
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <MobileNav currentTab={appState} setTab={setAppState} onNavigateHome={() => navigate('/')} />
        </Suspense>
      </main>

      <Suspense fallback={null}>
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
      </Suspense>
    </div>
    </MotionConfig>
  );
}
