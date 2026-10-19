"use client";

import { FileText, Info } from "lucide-react";
import { useState } from "react";

import Dialog from "@/components/Dialog/Dialog";
import { ISSUES_URL, MODEL_NAME, REPOSITORY_URL } from "@/shared/constants";

import styles from "./Topbar.module.scss";

interface TopbarProps {
  promptTemplate: string;
}

type OpenDialog = "about" | "prompt-template" | null;

export default function Topbar({ promptTemplate }: TopbarProps) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);

  return (
    <header className={styles["topbar"]}>
      <p className={styles["status"]}>
        <span className={styles["status-dot"]} aria-hidden="true" />
        <span className={styles["status-text"]}>{MODEL_NAME} via OpenRouter</span>
      </p>

      <nav className={styles["utilities"]} aria-label="Tool information">
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
