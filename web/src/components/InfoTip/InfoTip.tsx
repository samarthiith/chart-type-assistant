import { Info } from "lucide-react";
import type { KeyboardEvent } from "react";

import styles from "./InfoTip.module.scss";

interface InfoTipProps {
  id: string;
  text: string;
}

/** Superscript info icon that reveals `text` on hover or focus. Point a field's aria-describedby at `id`. */
export default function InfoTip({ id, text }: InfoTipProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      event.currentTarget.blur();
    }
  }

  return (
    <sup className={styles["info-tip"]}>
      <button
        type="button"
        className={styles["trigger"]}
        aria-label="More information"
        aria-describedby={id}
        onKeyDown={handleKeyDown}
      >
        <Info size={13} aria-hidden="true" />
      </button>
      <span id={id} role="tooltip" className={styles["tooltip"]}>
        {text}
      </span>
    </sup>
  );
}
