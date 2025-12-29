import React, { useState, useEffect } from 'react';
import { Evaluation, ViewState, TreeRecord } from './types';
import { createNewEvaluation } from './constants';
import * as Storage from './services/storage';
import EvaluationList from './components/EvaluationList';
import GeneralInfoForm from './components/GeneralInfoForm';
import TreeEvaluation from './components/TreeEvaluation';
import Summary from './components/Summary';
import SplashScreen from './components/SplashScreen';
import UserManual from './components/UserManual'; // Import the new UserManual component
import { Loader2 } from 'lucide-react';

const App = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [currentEval, setCurrentEval] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Theme Management
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Initial Load
  useEffect(() => {
    const data = Storage.getEvaluations();
    setEvaluations(data);
    setLoading(false);
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (currentEval) {
      const timer = setTimeout(() => {
        Storage.saveSingleEvaluation(currentEval);
        
        // Update the list view state without reloading from disk to prevent UI jumps
        setEvaluations(prev => {
           const idx = prev.findIndex(e => e.id === currentEval.id);
           if (idx >= 0) {
             const copy = [...prev];
             copy[idx] = currentEval;
             return copy;
           }
           return [currentEval, ...prev];
        });

        // Flash toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1500);
      }, 3000); // 3-second debounce autosave

      return () => clearTimeout(timer);
    }
  }, [currentEval]);

  // View Transitions
  
  // Save and properly exit to Home
  const handleSaveAndExit = () => {
    if (currentEval) {
      Storage.saveSingleEvaluation(currentEval);
      // Update local list state immediately
      setEvaluations(prev => {
         const idx = prev.findIndex(e => e.id === currentEval.id);
         if (idx >= 0) {
           const copy = [...prev];
           copy[idx] = currentEval;
           return copy;
         }
         return [currentEval, ...prev];
      });
      setCurrentEval(null); // Clear active evaluation
    }
    setView(ViewState.HOME);
  };

  const handleNewEvaluation = () => {
    const newEval = createNewEvaluation();
    setCurrentEval(newEval);
    setView(ViewState.NEW_EVALUATION);
  };

  const handleSelectEvaluation = (evalData: Evaluation) => {
    setCurrentEval(evalData);
    if (evalData.status === 'completed') {
      setView(ViewState.SUMMARY);
    } else if (!evalData.nombreLote) {
      setView(ViewState.NEW_EVALUATION);
    } else {
      setView(ViewState.TREE_EVALUATION);
    }
  };

  const handleDelete = (id: string) => {
    const updated = Storage.deleteEvaluation(id);
    setEvaluations(updated);
    // If we are currently editing the one being deleted (unlikely via UI but possible), exit
    if (currentEval?.id === id) {
      setCurrentEval(null);
      setView(ViewState.HOME);
    }
  };

  const handleGeneralInfoNext = () => {
    if (currentEval) {
       // Force immediate save when transitioning screens
       Storage.saveSingleEvaluation(currentEval);
       setView(ViewState.TREE_EVALUATION);
    }
  };

  const updateCurrentTree = (treeId: number, data: any) => {
    if (!currentEval) return;
    
    // Update the specific tree
    const updatedTrees = currentEval.trees.map(t => 
      t.id === treeId ? { ...t, ...data } : t
    );
    
    // Update lastModified
    setCurrentEval({
      ...currentEval,
      trees: updatedTrees,
      lastModified: Date.now()
    });
  };

  const handleTreeNavigate = (newIndex: number) => {
    if (!currentEval) return;
    setCurrentEval({
      ...currentEval,
      currentTreeIndex: newIndex,
      lastModified: Date.now()
    });
  };

  const handleFinishEvaluation = (finalTrees?: TreeRecord[]) => {
    if (currentEval) {
      // Use the projected trees if provided, otherwise use current state
      const treesToSave = finalTrees || currentEval.trees;
      
      const completed: Evaluation = { 
        ...currentEval, 
        trees: treesToSave,
        status: 'completed',
        lastModified: Date.now()
      };
      
      setCurrentEval(completed);
      Storage.saveSingleEvaluation(completed);
      setView(ViewState.SUMMARY);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <div className="h-[100dvh] flex items-center justify-center dark:bg-gray-900"><Loader2 className="animate-spin text-green-600 dark:text-green-400" size={48} /></div>;
  }

  return (
    // h-[100dvh] is crucial for mobile browsers to handle address bars correctly
    <div className="h-[100dvh] w-full max-w-md mx-auto bg-white dark:bg-gray-900 shadow-2xl overflow-hidden relative font-sans transition-colors duration-200">
      {/* Toast Notification with safe-area top margin */}
      <div 
        className={`fixed top-4 mt-[env(safe-area-inset-top)] left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/90 text-white dark:text-black text-xs px-3 py-1 rounded-full pointer-events-none transition-opacity duration-300 z-50 ${showToast ? 'opacity-100' : 'opacity-0'}`}
      >
        Guardado automáticamente
      </div>

      {view === ViewState.HOME && (
        <EvaluationList 
          evaluations={evaluations}
          onNew={handleNewEvaluation}
          onSelect={handleSelectEvaluation}
          onDelete={handleDelete}
          toggleTheme={toggleTheme}
          isDark={darkMode}
          onShowManual={() => setView(ViewState.USER_MANUAL)} // Pass new prop
        />
      )}

      {view === ViewState.NEW_EVALUATION && currentEval && (
        <GeneralInfoForm 
          data={currentEval}
          onChange={setCurrentEval}
          onNext={handleGeneralInfoNext}
          onBack={handleSaveAndExit}
        />
      )}

      {view === ViewState.TREE_EVALUATION && currentEval && (
        <TreeEvaluation 
          evaluation={currentEval}
          onUpdateTree={updateCurrentTree}
          onNavigate={handleTreeNavigate}
          onFinish={handleFinishEvaluation}
          onBack={handleSaveAndExit}
          toggleTheme={toggleTheme}
          isDark={darkMode}
        />
      )}

      {view === ViewState.SUMMARY && currentEval && (
        <Summary 
          evaluation={currentEval}
          onBackToEdit={() => setView(ViewState.TREE_EVALUATION)}
          onExit={handleSaveAndExit}
        />
      )}

      {view === ViewState.USER_MANUAL && (
        <UserManual onBack={() => setView(ViewState.HOME)} />
      )}
    </div>
  );
};

export default App;