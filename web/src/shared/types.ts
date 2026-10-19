export interface VocabularyChart {
  name: string;
  category: string;
  icon: string;
  available: boolean;
  description: string;
}

export interface VisualVocabulary {
  categories: string[];
  charts: VocabularyChart[];
}

export interface Recommendation {
  chart_name: string;
  category: string;
  x_axis: string;
  y_axis: string;
  legend: string;
  justification: string;
  icon?: string;
  chart_description?: string;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  rawResponse: string;
}

export interface RecommendRequestBody {
  keyMessage: string;
  dataDescription: string;
  apiKey?: string;
}

export type RecommendErrorKind = "configuration" | "validation" | "request";

export interface RecommendErrorBody {
  error: {
    kind: RecommendErrorKind;
    message: string;
  };
}
