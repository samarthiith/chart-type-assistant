"use client";

import { FileText, Info, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

import Dialog from "@/components/Dialog/Dialog";
import { ISSUES_URL, MODEL_NAME, REPOSITORY_URL } from "@/shared/constants";

import styles from "./Topbar.module.scss";

interface TopbarProps {
  promptTemplate: string;
}

type OpenDialog = "about" | "prompt-template" | null;

export default function Topbar({ promptTemplate }: TopbarProps) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const disclaimerId = useId();

  return (
    <header className={styles["topbar"]}>
      <nav className={styles["utilities"]} aria-label="Tool information">
        <span className={styles["disclaimer"]}>
          <button
            type="button"
            className={styles["utility-button"]}
            aria-label="AI disclaimer"
            aria-describedby={disclaimerId}
            onKeyDown={(event) => event.key === "Escape" && event.currentTarget.blur()}
          >
            <TriangleAlert size={18} aria-hidden="true" />
          </button>
          <span id={disclaimerId} role="tooltip" className={styles["disclaimer-tooltip"]}>
            Recommendations are AI-generated and may not always be accurate.
          </span>
        </span>
        <button
          type="button"
          className={styles["utility-button"]}
          title="About this tool"
          onClick={() => setOpenDialog("about")}
        >
          <Info size={18} aria-hidden="true" />
          <span className={styles["utility-label"]}>About</span>
        </button>
        <button
          type="button"
          className={styles["utility-button"]}
          title="Prompt template"
          onClick={() => setOpenDialog("prompt-template")}
        >
          <FileText size={18} aria-hidden="true" />
          <span className={styles["utility-label"]}>Prompt template</span>
        </button>
      </nav>

      <Dialog open={openDialog === "about"} title="About This Tool" onClose={() => setOpenDialog(null)}>
        <div className={styles["about"]}>
          <h3>How It Works</h3>
          <ul>
            <li>Your key message and data description are combined into a structured prompt.</li>
            <li>
              The tool sends that prompt to <strong>{MODEL_NAME}</strong> through OpenRouter.
            </li>
            <li>
              Tool calling is used so recommendations return in a structured format that can be parsed and matched
              to graph visuals.
            </li>
            <li>It does not perform internet search and relies on model knowledge.</li>
          </ul>
          <h3>Developer</h3>
          <ul>
            <li>
              This project is open source: <a href={REPOSITORY_URL}>chart-type-assistant</a>
            </li>
            <li>
              Feel free to report any bugs or feature suggestions via <a href={ISSUES_URL}>github issues</a>
            </li>
          </ul>
        </div>
      </Dialog>

      <Dialog
        open={openDialog === "prompt-template"}
        title="Prompt Template"
        size="large"
        onClose={() => setOpenDialog(null)}
      >
        <pre className={styles["prompt-template"]}>
          <code>{promptTemplate}</code>
        </pre>
      </Dialog>
    </header>
  );
}
