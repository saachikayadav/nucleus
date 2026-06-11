'use client';
import { useEffect, useState } from 'react';

export default function Loader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="loader">
      <div className="loader-mark">
        <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L13 5.5V10.5L8 14L3 10.5V5.5L8 2Z" fill="rgba(255,255,255,0.3)" />
          <path d="M8 5L11 7V9L8 11L5 9V7L8 5Z" fill="#fff" />
        </svg>
      </div>
      <div className="loader-text">Valkyra Nucleus</div>
      <div className="loader-sub">Connecting to Hospital API...</div>
      <div className="loader-bar-track">
        <div className="loader-bar" />
      </div>
    </div>
  );
}
