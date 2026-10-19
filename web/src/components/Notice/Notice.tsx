import { CircleCheck, CircleX, Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./Notice.module.scss";

export type NoticeTone = "success" | "error" | "info" | "tip" | "warning";

interface NoticeProps {
  tone: NoticeTone;
  children: ReactNode;
}

const TONE_ICONS = {
  success: CircleCheck,
  error: CircleX,
  info: Info,
  tip: Lightbulb,
  warning: TriangleAlert,
};

export default function Notice({ tone, children }: NoticeProps) {
  const Icon = TONE_ICONS[tone];

  return (
    <div className={`${styles["notice"]} ${styles[tone]}`} role={tone === "error" ? "alert" : "status"}>
      <Icon className={styles["icon"]} size={18} aria-hidden="true" />
      <div className={styles["body"]}>{children}</div>
    </div>
  );
}
