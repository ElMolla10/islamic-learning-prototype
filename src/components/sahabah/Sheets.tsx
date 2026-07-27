"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

export function BottomSheet({ open, onClose, titleId, title, variant = "sheet", children }: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  variant?: "sheet" | "fullscreen";
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),[href]')];
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="drawer-layer bio-sheet-layer">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label={title} />
      <div className={`bio-sheet bio-sheet-${variant}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef}>
        <header className="bio-sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button ref={closeRef} className="icon-button" type="button" onClick={onClose} aria-label={title}>
            <CloseIcon />
          </button>
        </header>
        <div className="bio-sheet-body">{children}</div>
      </div>
    </div>
  );
}
