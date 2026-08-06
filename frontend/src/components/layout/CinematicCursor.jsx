import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CinematicCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || window.matchMedia('(pointer: coarse)').matches) return undefined;

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    const moveX = gsap.quickTo(cursor, 'x', { duration: 0.55, ease: 'power3.out' });
    const moveY = gsap.quickTo(cursor, 'y', { duration: 0.55, ease: 'power3.out' });

    const onMove = (event) => {
      moveX(event.clientX);
      moveY(event.clientY);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return <div ref={cursorRef} className="cinematic-cursor hidden lg:block" aria-hidden />;
}
