import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import TourStep from './TourStep';
import '../styles/tour.css';

const STORAGE_KEY = 'onboardingTour.completed';

const TourContext = createContext(null);

// PUBLIC_INTERFACE
export function TourProvider({ children }) {
  const steps = useMemo(() => ([
    {
      id: 'upload',
      anchorSelector: '[data-tour-id="upload"]',
      title: 'Upload your data',
      content: 'Start by uploading one or more CSV or Jira export files. You can drag-and-drop or click Browse.',
    },
    {
      id: 'rules',
      anchorSelector: '[data-tour-id="rules"]',
      title: 'Configure rules',
      content: 'Adjust grouping and timeframe to shape how the report will be generated.',
    },
    {
      id: 'preview',
      anchorSelector: '[data-tour-id="preview"]',
      title: 'Preview the report',
      content: 'Review the grouped items and totals to ensure everything looks correct.',
    },
    {
      id: 'export',
      anchorSelector: '[data-tour-id="export"]',
      title: 'Export your report',
      content: 'Download your weekly status report once you are satisfied with the preview.',
    },
  ]), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const previouslyFocusedRef = useRef(null);

  // read completion state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setCompleted(raw === 'true');
    } catch {
      // ignore storage failures
    }
  }, []);

  const persistCompleted = useCallback((val) => {
    setCompleted(val);
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch {
      // ignore
    }
  }, []);

  // keyboard navigation (global when open)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      const key = e.key;
      if (key === 'Escape') {
        e.preventDefault();
        skip();
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        back();
      } else if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        next();
      }
    };
    document.addEventListener('keydown', onKey, { capture: true });
    return () => document.removeEventListener('keydown', onKey, { capture: true });
  }, [isOpen, currentIndex]);

  const open = useCallback(() => {
    previouslyFocusedRef.current = document.activeElement;
    setCurrentIndex(0);
    setIsOpen(true);
    // mark as not completed yet when replaying
    persistCompleted(false);
  }, [persistCompleted]);

  const startIfFirstTime = useCallback(() => {
    if (!completed) {
      open();
    }
  }, [completed, open]);

  const close = useCallback(() => {
    setIsOpen(false);
    // return focus
    const el = previouslyFocusedRef.current;
    if (el && typeof el.focus === 'function') {
      setTimeout(() => el.focus(), 0);
    }
  }, []);

  const finish = useCallback(() => {
    persistCompleted(true);
    close();
  }, [close, persistCompleted]);

  const skip = useCallback(() => {
    close();
  }, [close]);

  const next = useCallback(() => {
    setCurrentIndex((i) => {
      if (i + 1 >= steps.length) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, finish]);

  const back = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const value = useMemo(() => ({
    // state
    steps,
    currentIndex,
    isOpen,
    completed,
    // actions
    start: open,
    startIfFirstTime,
    resetAndStart: open,
    close,
    next,
    back,
    skip,
    finish,
  }), [steps, currentIndex, isOpen, completed, open, startIfFirstTime, close, next, back, skip, finish]);

  // Render the overlay/step when open
  const currentStep = isOpen ? steps[currentIndex] : null;

  return (
    <TourContext.Provider value={value}>
      {children}
      {currentStep ? (
        <TourStep
          key={currentStep.id}
          stepIndex={currentIndex}
          totalSteps={steps.length}
          anchorSelector={currentStep.anchorSelector}
          title={currentStep.title}
          content={currentStep.content}
          onNext={next}
          onBack={back}
          onSkip={skip}
          onClose={finish}
          isLast={currentIndex === steps.length - 1}
        />
      ) : null}
    </TourContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useTourController() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTourController must be used within TourProvider');
  return ctx;
}

export default TourProvider;
