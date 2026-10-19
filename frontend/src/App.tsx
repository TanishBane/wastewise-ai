import React, { useState, useEffect } from 'react';
import { BrandIntro } from './components/BrandIntro';
import { AppShell } from './components/AppShell';
import { PageId } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { DemandForecastView } from './views/DemandForecastView';
import { PreparationPlannerView } from './views/PreparationPlannerView';
import { WasteRiskMonitoringView } from './views/WasteRiskMonitoringView';
import { PerformanceImpactView } from './views/PerformanceImpactView';
import { DataModelView } from './views/DataModelView';
import { PrivacyPolicyView } from './views/PrivacyPolicyView';
import { TermsOfUseView } from './views/TermsOfUseView';
import { TransparencyView } from './views/TransparencyView';
import { HelpCenterView } from './views/HelpCenterView';
import { GuidedDemoModal } from './components/GuidedDemoModal';
import { LimitationsModal } from './components/common/LimitationsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ScenarioPreset } from './components/TopBar';
import { fetchConfig } from './api';

const VALID_PAGES: PageId[] = [
  'overview',
  'demand-forecast',
  'prep-planner',
  'waste-risk',
  'performance',
  'data-model',
  'privacy',
  'terms',
  'transparency',
  'help',
];

export function App() {
  const [showIntro, setShowIntro] = useState(() => {
    return sessionStorage.getItem('wastewise_intro_seen') !== 'true';
  });

  // URL Hash synchronization
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    const hash = window.location.hash.replace('#', '') as PageId;
    return VALID_PAGES.includes(hash) ? hash : 'overview';
  });

  const [demoTriggered, setDemoTriggered] = useState(false);
  const [isSynthetic, setIsSynthetic] = useState(true);
  const [serviceDate, setServiceDate] = useState('27 Sep 2026');
  const [activeScenario, setActiveScenario] = useState<ScenarioPreset>('normal');

  // Modals state
  const [guidedDemoOpen, setGuidedDemoOpen] = useState(false);
  const [limitationsOpen, setLimitationsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Sync hash when page changes
  const handleSelectPage = (page: PageId) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser Back/Forward hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageId;
      if (VALID_PAGES.includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === '1') {
        handleSelectPage('overview');
      } else if (e.key === '2') {
        handleSelectPage('demand-forecast');
      } else if (e.key === '3') {
        handleSelectPage('prep-planner');
      } else if (e.key === '4') {
        handleSelectPage('waste-risk');
      } else if (e.key === '5') {
        handleSelectPage('performance');
      } else if (e.key === '6') {
        handleSelectPage('data-model');
      } else if (e.key === '[') {
        // Toggle sidebar collapse
        const current = localStorage.getItem('wastewise_sidebar_collapsed') === 'true';
        localStorage.setItem('wastewise_sidebar_collapsed', String(!current));
        window.dispatchEvent(new Event('storage'));
      } else if (e.key === 'Escape') {
        setShortcutsOpen(false);
        setGuidedDemoOpen(false);
        setLimitationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        setIsSynthetic(cfg.is_synthetic ?? true);
        if (cfg.latest_date) {
          try {
            const parts = cfg.latest_date.split('-');
            if (parts.length === 3) {
              const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              const formatted = d.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              setServiceDate(formatted);
            }
          } catch {
            setServiceDate(cfg.latest_date);
          }
        }
      })
      .catch(() => {
        // Fallback default
      });
  }, [currentPage]);

  const handleLaunchDemoScenario = () => {
    setGuidedDemoOpen(true);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleSelectScenario = (scenario: ScenarioPreset) => {
    setActiveScenario(scenario);
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Menu Item,Category,Forecast Demand,Recommended Prep,Cost At Risk\n' +
      'Paneer Butter Masala,Main Course,24,25,980\n' +
      'Dal Makhani,Main Course,28,30,650\n' +
      'Steamed Rice,Staple,42,44,420\n' +
      'Roti / Chapati,Bread,35,36,360\n' +
      'Mix Veg Curry,Main Course,16,17,450\n' +
      'Gulab Jamun,Dessert,16,16,480\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wastewise_operations_${activeScenario}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {showIntro && <BrandIntro onComplete={handleIntroComplete} />}

      <AppShell
        currentPage={currentPage}
        onSelectPage={handleSelectPage}
        onLaunchDemoScenario={handleLaunchDemoScenario}
        isSynthetic={isSynthetic}
        serviceDate={serviceDate}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        onOpenLimitations={() => setLimitationsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onExportReport={handleExportCsv}
      >
        {currentPage === 'overview' && (
          <OverviewView
            onNavigate={handleSelectPage}
            onOpenLimitations={() => setLimitationsOpen(true)}
            scenarioPreset={activeScenario}
            onSelectScenario={handleSelectScenario}
          />
        )}
        {currentPage === 'demand-forecast' && (
          <DemandForecastView
            onOpenLimitations={() => setLimitationsOpen(true)}
            scenarioPreset={activeScenario}
            onSelectScenario={handleSelectScenario}
          />
        )}
        {currentPage === 'prep-planner' && (
          <PreparationPlannerView
            demoTriggered={demoTriggered}
            onOpenLimitations={() => setLimitationsOpen(true)}
            scenarioPreset={activeScenario}
            onSelectScenario={handleSelectScenario}
          />
        )}
        {currentPage === 'waste-risk' && (
          <WasteRiskMonitoringView
            onOpenLimitations={() => setLimitationsOpen(true)}
            scenarioPreset={activeScenario}
            onSelectScenario={handleSelectScenario}
          />
        )}
        {currentPage === 'performance' && (
          <PerformanceImpactView
            onOpenLimitations={() => setLimitationsOpen(true)}
          />
        )}
        {currentPage === 'data-model' && (
          <DataModelView
            onOpenLimitations={() => setLimitationsOpen(true)}
          />
        )}

        {/* Legal, Trust & Playbook Pages */}
        {currentPage === 'privacy' && (
          <PrivacyPolicyView onNavigate={handleSelectPage} />
        )}
        {currentPage === 'terms' && (
          <TermsOfUseView onNavigate={handleSelectPage} />
        )}
        {currentPage === 'transparency' && (
          <TransparencyView
            onNavigate={handleSelectPage}
            onOpenLimitations={() => setLimitationsOpen(true)}
          />
        )}
        {currentPage === 'help' && (
          <HelpCenterView
            onNavigate={handleSelectPage}
            onLaunchDemoTour={() => setGuidedDemoOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />
        )}
      </AppShell>

      {/* Guided 5-Step Demo Walkthrough Modal */}
      <GuidedDemoModal
        isOpen={guidedDemoOpen}
        onClose={() => setGuidedDemoOpen(false)}
        onSelectScenario={handleSelectScenario}
        onNavigatePage={(pageId) => {
          if (pageId === 'overview') handleSelectPage('overview');
          else if (pageId === 'demand_forecast') handleSelectPage('demand-forecast');
          else if (pageId === 'smart_preparation') handleSelectPage('prep-planner');
          else if (pageId === 'waste_risk') handleSelectPage('waste-risk');
          else if (pageId === 'impact_analytics') handleSelectPage('performance');
        }}
      />

      {/* Scientific Validation & Limitations Modal */}
      <LimitationsModal
        isOpen={limitationsOpen}
        onClose={() => setLimitationsOpen(false)}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}

export default App;
