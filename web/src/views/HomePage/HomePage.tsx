"use client";

import {
  BookOpen,
  Bot,
  ChartColumn,
  ChartLine,
  ChartScatter,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  Table,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import Button from "@/components/Button/Button";
import Notice from "@/components/Notice/Notice";
import RecommendationCard from "@/components/RecommendationCard/RecommendationCard";
import Topbar from "@/components/Topbar/Topbar";
import { HOW_CHARTS_WORK_URL, VISUAL_VOCABULARY_URL } from "@/shared/constants";
import type { Recommendation, RecommendationResult, RecommendErrorBody } from "@/shared/types";

import styles from "./HomePage.module.scss";

interface HomePageProps {
  serverKeyConfigured: boolean;
  promptTemplate: string;
}

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "error"; kind: "configuration" | "request"; message: string }
  | { status: "success"; recommendations: Recommendation[] };

export default function HomePage({ serverKeyConfigured, promptTemplate }: HomePageProps) {
  const [keyMessage, setKeyMessage] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState<ResultState>({ status: "idle" });
  const requestRef = useRef<AbortController | null>(null);
  const keyMessageId = useId();
  const dataDescriptionId = useId();
  const apiKeyId = useId();
  const apiKeyHelpId = useId();

  useEffect(() => () => requestRef.current?.abort(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!keyMessage.trim()) {
      setResult({ status: "invalid", message: "Please enter a key message" });
      return;
    }
    if (!dataDescription.trim()) {
      setResult({ status: "invalid", message: "Please describe your data" });
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setResult({ status: "loading" });

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyMessage, dataDescription, apiKey: apiKey.trim() || undefined }),
        signal: controller.signal,
      });
      const body = (await response.json()) as RecommendationResult | RecommendErrorBody;

      if ("error" in body) {
        const { kind, message } = body.error;
        setResult(kind === "validation" ? { status: "invalid", message } : { status: "error", kind, message });
      } else {
        setResult({ status: "success", recommendations: body.recommendations });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      setResult({ status: "error", kind: "request", message: `Error calling API: ${message}` });
    }
  }

  return (
    <div className={styles["workspace"]}>
      <Topbar promptTemplate={promptTemplate} />

      <main className={styles["main"]}>
        <header className={styles["page-header"]}>
          <h1 className={styles["title"]}>
            Chart Type Assistant
            <span className={styles["title-icons"]} aria-hidden="true">
              <ChartColumn size={22} />
              <ChartLine size={22} />
              <ChartScatter size={22} />
            </span>
          </h1>
          <p className={styles["intro"]}>
            This tool uses AI to recommend the best types of charts based on your key message and data.
          </p>
        </header>

        <section className={styles["reference"]} aria-label="About the Visual Vocabulary">
          <blockquote className={styles["quote"]}>
            <p>&ldquo;Graphs show relationships not data.&rdquo;</p>
            <footer>
              &mdash; Alan Smith (
              <BookOpen size={14} aria-hidden="true" className={styles["inline-icon"]} />{" "}
              <a href={HOW_CHARTS_WORK_URL}>How Charts Work</a>)
            </footer>
          </blockquote>
          <p className={styles["reference-copy"]}>
            <a href={VISUAL_VOCABULARY_URL}>FT Interactive Visual Vocabulary</a> is a comprehensive resource for
            chart types, their characteristics, and <strong>relationships</strong> they best represent
          </p>
        </section>

        <form className={styles["form"]} onSubmit={handleSubmit} noValidate>
          <div className={styles["fields"]}>
            <div className={styles["field"]}>
              <label htmlFor={keyMessageId} className={styles["field-label"]}>
                <MessageSquareText size={16} aria-hidden="true" />
                Key message / relationship
              </label>
              <p className={styles["field-help"]}>What is the relationship you want to show?</p>
              <textarea
                id={keyMessageId}
                className={styles["textarea"]}
                value={keyMessage}
                onChange={(event) => setKeyMessage(event.target.value)}
                placeholder="e.g., Solar energy has grown faster than wind energy in the last 5 years"
              />
            </div>
            <div className={styles["field"]}>
              <label htmlFor={dataDescriptionId} className={styles["field-label"]}>
                <Table size={16} aria-hidden="true" />
                Data description
              </label>
              <p className={styles["field-help"]}>Describe the data you have for the graph.</p>
              <textarea
                id={dataDescriptionId}
                className={styles["textarea"]}
                value={dataDescription}
                onChange={(event) => setDataDescription(event.target.value)}
                placeholder={
                  "e.g., Annual electricity generation (MWh) from different renewable sources " +
                  "(solar, wind, hydro, geothermal) from 2019 to 2024"
                }
              />
            </div>
          </div>
          {!serverKeyConfigured && (
            <div className={styles["api-key"]}>
              <label htmlFor={apiKeyId} className={styles["field-label"]}>
                <KeyRound size={16} aria-hidden="true" />
                OpenRouter API key
              </label>
              <input
                id={apiKeyId}
                className={styles["api-key-input"]}
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                aria-describedby={apiKeyHelpId}
              />
              <p id={apiKeyHelpId} className={styles["field-help"]}>
                Used for this session only. Set OPENROUTER_API_KEY on the server to hide this field.
              </p>
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            icon={<Bot size={18} aria-hidden="true" />}
            disabled={result.status === "loading"}
          >
            Get Recommendations
          </Button>
          <p className={styles["disclaimer"]}>
            <TriangleAlert size={14} aria-hidden="true" />
            Recommendations are AI-generated and may not always be accurate.
          </p>
        </form>

        <section className={styles["results"]} aria-live="polite" aria-label="Recommendations">
          <ResultView result={result} />
        </section>
      </main>
    </div>
  );
}

function ResultView({ result }: { result: ResultState }) {
  switch (result.status) {
    case "idle":
      return null;
    case "loading":
      return (
        <p className={styles["loading"]} role="status">
          <LoaderCircle size={18} className={styles["spinner"]} aria-hidden="true" />
          Analyzing your data and generating recommendations...
        </p>
      );
    case "invalid":
      return <Notice tone="error">{result.message}</Notice>;
    case "error":
      return result.kind === "configuration" ? (
        <>
          <Notice tone="error">Configuration Error: {result.message}</Notice>
          <Notice tone="info">
            <p>
              Set OPENROUTER_API_KEY in <code>web/.env.local</code>, or enter your key in the API key field.
            </p>
          </Notice>
        </>
      ) : (
        <>
          <Notice tone="error">Error: {result.message}</Notice>
          <Notice tone="info">Please check your API key and try again.</Notice>
        </>
      );
    case "success":
      return (
        <>
          {result.recommendations.length > 0 && (
            <>
              <Notice tone="success">Recommendations generated!</Notice>
              {result.recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={`${recommendation.chart_name}-${index}`}
                  recommendation={recommendation}
                  index={index + 1}
                />
              ))}
            </>
          )}
          <Notice tone="tip">
            <p>
              <strong>Need more help?</strong>
            </p>
            <p>
              Visit the <a href={VISUAL_VOCABULARY_URL}>FT Interactive Visual Vocabulary</a> to explore these chart
              types in detail and see examples of each visualization.
            </p>
          </Notice>
        </>
      );
  }
}
