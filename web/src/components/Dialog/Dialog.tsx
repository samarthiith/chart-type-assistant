"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";

import styles from "./Dialog.module.scss";

interface DialogProps {
  open: boolean;
  title: string;
  size?: "medium" | "large";
  onClose: () => void;
  children: ReactNode;
}

export default function Dialog({ open, title, size = "medium", onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${styles["dialog"]} ${styles[size]}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className={styles["content"]}>
        <header className={styles["header"]}>
          <h2 id={titleId} className={styles["title"]}>
            {title}
          </h2>
          <button type="button" className={styles["close-button"]} aria-label="Close" title="Close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className={styles["body"]}>{children}</div>
      </div>
    </dialog>
  );
}
