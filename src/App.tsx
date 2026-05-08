import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { AnimatePresence } from 'motion/react';

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

// Hooks & Types
import { useHistory } from './hooks/useHistory';
import { useLeadProcessor } from './hooks/useLeadProcessor';
import { ContactData, HistoryItem, ValidationRules } from './types';

import { MobileNav } from './components/MobileNav';
import { useToast } from './components/Toast';

type AppState = 'upload' | 'mapping' | 'processing' | 'results' | 'rules' | 'history';

export default function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [fileData, setFileData] = useState<ContactData[]>([]);
  const [fileName, setFileName] = useState('');
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<ContactData>(worksheet);

      if (json.length > 0) {
        setFileData(json);
        const fileHeaders = Object.keys(json[0]);
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
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleStartProcessing = async () => {
    setAppState('processing');
    try {
      const { valid, eliminated } = await processor.runProcessor(fileData, mappings, validationRules);
      
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

  const handleDownload = () => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    // Only export original columns as requested
    const exportData = processor.processedData.map(({ 
      originalIndex, 
      verificationStatus, 
      verificationReason, 
      confidenceScore, 
      bounceRisk, 
      reputationImpact,
      mxRecordFound,
      isCatchAll,
      isDisposable,
      isRoleBased,
      smtpValid,
      syntaxValid,
      domainAge,
      spfExists,
      dkimExists,
      isSpamtrapProbability,
      ...originalData 
    }) => originalData);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Leads');
    
    XLSX.writeFile(workbook, `${baseName}_Cleaned${extension}`);
    toast('EXPORT COMPLETE: CLEANED LIST READY', 'success');
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

    const exportData = item.processedData.map(({ 
      originalIndex, 
      verificationStatus, 
      verificationReason, 
      confidenceScore, 
      bounceRisk, 
      reputationImpact,
      mxRecordFound,
      isCatchAll,
      isDisposable,
      isRoleBased,
      smtpValid,
      syntaxValid,
      domainAge,
      spfExists,
      dkimExists,
      isSpamtrapProbability,
      ...originalData 
    }) => originalData);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Leads');
    
    XLSX.writeFile(workbook, `${baseName}_Cleaned${extension}`);
    toast('EXPORT COMPLETE: HISTORICAL LIST READY', 'success');
  };

  const reset = () => {
    setAppState('upload');
    setFileData([]);
    processor.resetProcessor();
  };

  return (
    <div className="flex h-screen bg-[#000000] text-slate-100 font-sans overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      <Sidebar currentTab={appState} setTab={setAppState} />

      <main className="flex-1 flex flex-col overflow-hidden pb-24 lg:pb-0">
        <Header 
          appState={appState} 
          isProcessing={processor.isProcessing} 
          onDownload={handleDownload} 
          onReset={reset} 
        />

        <section className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 bg-[#000000]">
          <AnimatePresence mode="wait">
            {appState === 'upload' && <LeadUpload onDrop={onDrop} />}
            {appState === 'mapping' && (
              <MappingSection 
                fileName={fileName} totalLeads={fileData.length} headers={headers} 
                mappings={mappings} setMappings={setMappings} 
                onStartProcessing={handleStartProcessing} isProcessing={processor.isProcessing} 
                onPreview={() => openPreview(fileData, 'Original Data Preview')}
              />
            )}
            {appState === 'rules' && (
              <RulesSection 
                rules={validationRules} 
                onToggle={(key) => setValidationRules(p => ({ ...p, [key]: !p[key]}))} 
              />
            )}
            {appState === 'history' && (
              <HistorySection 
                history={history} loadItem={loadHistoryItem} 
                downloadItem={downloadHistoryItem} clearHistory={clearHistory} 
              />
            )}
            {appState === 'results' && (
              <ResultsDashboard 
                processedData={processor.processedData} 
                eliminatedData={processor.eliminatedData} 
                mappings={mappings} 
                onPreview={openPreview}
              />
            )}
          </AnimatePresence>
        </section>

        <Footer />
      </main>

      <MobileNav currentTab={appState} setTab={setAppState} />

      <AnimatePresence>
        {appState === 'processing' && (
          <LoadingOverlay progress={processor.progress} estimatedSeconds={processor.estimatedSeconds} />
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
