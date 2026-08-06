import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent, trackPageDuration } from '../services/activityTracker';

export default function usePageViewTracker() {
  const location = useLocation();
  const enterTimeRef = useRef(Date.now());
  const prevPathRef = useRef(null);

  useEffect(() => {
    const now = Date.now();
    if (prevPathRef.current) {
      const duration = (now - enterTimeRef.current) / 1000;
      trackPageDuration(prevPathRef.current, duration);
    }
    trackEvent('page_view', { title: document.title });
    enterTimeRef.current = now;
    prevPathRef.current = location.pathname + location.search;
  }, [location.pathname, location.search]);
}