import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Compute best position around a target rect with viewport collision detection.
 * Returns: { top, left, placement }
 */
function computePosition(targetRect, tooltipRect, viewportPadding = 8) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const placements = ['bottom', 'top', 'right', 'left'];
  // Try all, pick first that doesn't collide; fallback to bottom.
  for (const p of placements) {
    let top = 0;
    let left = 0;
    if (p === 'bottom') {
      top = targetRect.bottom + 8;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
    } else if (p === 'top') {
      top = targetRect.top - tooltipRect.height - 8;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
    } else if (p === 'right') {
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.right + 8;
    } else if (p === 'left') {
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.left - tooltipRect.width - 8;
    }
    const fitsHoriz = left >= viewportPadding && left + tooltipRect.width <= vw - viewportPadding;
    const fitsVert = top >= viewportPadding && top + tooltipRect.height <= vh - viewportPadding;
    if (fitsHoriz && fitsVert) {
      return { top: Math.max(viewportPadding, top), left: Math.max(viewportPadding, left), placement: p };
    }
  }
  // Fallback to clamped bottom
  const fbTop = Math.min(vh - tooltipRect.height - viewportPadding, Math.max(viewportPadding, targetRect.bottom + 8));
  const fbLeft = Math.min(vw - tooltipRect.width - viewportPadding, Math.max(viewportPadding, targetRect.left));
  return { top: fbTop, left: fbLeft, placement: 'bottom' };
}

/**
 * Find first visible element for selector (handles shadow root absence).
 */
function queryVisible(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return el;
}

/**
 * PUBLIC_INTERFACE
 * TourStep renders a floating tooltip-like dialog anchored to an element.
 */
export default function TourStep({
  stepIndex,
  totalSteps,
  anchorSelector,
  title,
  content,
  onNext,
  onBack,
  onSkip,
  onClose,
  isLast,
}) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, placement: 'bottom' });
  const [anchorRect, setAnchorRect] = useState(null);
  const [visible, setVisible] = useState(false);

  const ids = useMemo(() => {
    const base = `tour-${stepIndex}`;
    return {
      label: `${base}-label`,
      desc: `${base}-desc`,
    };
  }, [stepIndex]);

  // Calculate position after mount and on resize/scroll
  const recalc = () => {
    const anchorEl = queryVisible(anchorSelector);
    if (!anchorEl || !containerRef.current) return;
    const rect = anchorEl.getBoundingClientRect();
    setAnchorRect(rect);
    const tipRect = containerRef.current.getBoundingClientRect();
    const p = computePosition(rect, tipRect, 8);
    setPos(p);
  };

  useLayoutEffect(() => {
    // Initial delay to allow layouts to settle
    const t = setTimeout(() => {
      setVisible(true);
      recalc();
      containerRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => recalc();
    const onResize = () => recalc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        onSkip?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onSkip]);

  // Live region for step changes
  useEffect(() => {
    const el = document.getElementById('tour-live-region');
    if (!el) return;
    el.textContent = `Step ${stepIndex + 1} of ${totalSteps}: ${title}`;
  }, [stepIndex, totalSteps, title]);

  // Arrow direction class
  const arrowClass = `op-tour-arrow ${pos.placement}`;

  return (
    <>
      <div id="tour-live-region" className="sr-only" aria-live="polite" />
      <div
        ref={containerRef}
        className={`op-tour ${visible ? 'enter' : ''}`}
        style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
        role="dialog"
        aria-modal="false"
        aria-labelledby={ids.label}
        aria-describedby={ids.desc}
        tabIndex={-1}
      >
        <div className={arrowClass} aria-hidden="true" />
        <div className="op-tour-header">
          <div className="op-tour-step">{stepIndex + 1} / {totalSteps}</div>
          <button className="op-tour-close" onClick={onSkip} aria-label="Skip tour" type="button">×</button>
        </div>
        <h3 id={ids.label} className="op-tour-title">{title}</h3>
        <p id={ids.desc} className="op-tour-content">{content}</p>
        {anchorRect ? (
          <div className="op-tour-anchorhint" aria-hidden="true">
            Highlight: {Math.round(anchorRect.width)}×{Math.round(anchorRect.height)} px
          </div>
        ) : null}
        <div className="op-tour-actions">
          <button className="op-btn secondary" onClick={onBack} type="button" aria-label="Previous step" disabled={stepIndex === 0}>
            Back
          </button>
          <div className="op-spacer" />
          {!isLast ? (
            <button className="op-btn" onClick={onNext} type="button" aria-label="Next step">Next</button>
          ) : (
            <button className="op-btn" onClick={onClose} type="button" aria-label="Finish tour">Done</button>
          )}
        </div>
      </div>
      {/* Optional subtle overlay to dim background for focus */}
      <div className="op-tour-overlay" aria-hidden="true" />
    </>
  );
}
