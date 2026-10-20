"use client";

import Image from "next/image";
import { useState } from "react";

import type { Recommendation } from "@/shared/types";
import { formatChartName, iconUrl } from "@/shared/utils";

import styles from "./RecommendationCard.module.scss";

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export default function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const chartTitle = formatChartName(recommendation.chart_name || "Unknown");
  const category = recommendation.category || "Uncategorized";
  const showImage = Boolean(recommendation.icon) && !imageFailed;

  return (
    <article className={styles["card"]} aria-labelledby={`recommendation-${index}`}>
      <header className={styles["header"]}>
        <span className={styles["index"]}>{String(index).padStart(2, "0")}</span>
        <h3 id={`recommendation-${index}`} className={styles["title"]}>
          {chartTitle}
        </h3>
        <span className={styles["category"]}>
          Category: <em>{category}</em>
        </span>
      </header>

      <div className={styles["overview"]}>
        <figure className={styles["figure"]}>
          {showImage ? (
            <Image
              className={styles["icon"]}
              src={iconUrl(recommendation.icon ?? "")}
              alt={`${chartTitle} chart`}
              width={80}
              height={80}
              unoptimized
              onError={() => setImageFailed(true)}
            />
          ) : (
            <figcaption className={styles["missing-image"]}>Image not found</figcaption>
          )}
        </figure>

        <div className={styles["details"]}>
          {recommendation.chart_description && (
            <p className={styles["description"]}>{recommendation.chart_description}</p>
          )}
          <h4 className={styles["label"]}>Why this chart works</h4>
          <p>{recommendation.justification || "No justification provided."}</p>
        </div>
      </div>

      <div className={styles["mapping"]}>
        <section>
          <h4 className={styles["label"]}>Axis mapping</h4>
          <dl className={styles["axes"]}>
            <dt>X-axis</dt>
            <dd>{recommendation.x_axis || "Not specified"}</dd>
            <dt>Y-axis</dt>
            <dd>{recommendation.y_axis || "Not specified"}</dd>
          </dl>
        </section>
        <section>
          <h4 className={styles["label"]}>Legend</h4>
          <p>{recommendation.legend || "Not specified"}</p>
        </section>
      </div>
    </article>
  );
}
