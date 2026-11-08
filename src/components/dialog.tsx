'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Dialog({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={`dialog ${wide ? 'dialog-wide' : ''}`} aria-label={title} onCancel={onClose} onClose={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="dialog-content">
      <div className="dialog-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="닫기"><X size={21}/></button></div>
      {children}
    </div>
  </dialog>;
}
