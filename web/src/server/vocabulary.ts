import visualVocabulary from "@/data/visual_vocabulary.json";
import type { VisualVocabulary, VocabularyChart } from "@/shared/types";

export function loadVisualVocabulary(): VisualVocabulary {
  return visualVocabulary as VisualVocabulary;
}

export function getChartNames(): string[] {
  return loadVisualVocabulary().charts.map((chart) => chart.name);
}

export function getChartByName(name: string): VocabularyChart | undefined {
  return loadVisualVocabulary().charts.find((chart) => chart.name === name);
}
