import { MODEL_NAME } from "@/shared/constants";
import type { Recommendation, RecommendationResult } from "@/shared/types";
import { getChartByName, getChartNames, loadVisualVocabulary } from "@/server/vocabulary";

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const REQUEST_TIMEOUT_MS = 60_000;

export class ConfigurationError extends Error {
  name = "ConfigurationError";
}

export class OpenRouterError extends Error {
  name = "OpenRouterError";
}

export function isOpenRouterApiKeyConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

/** Resolves the API key from the user's input first, then the server environment. */
export function resolveOpenRouterApiKey(apiKey?: string): string {
  const userKey = apiKey?.trim();
  if (userKey) {
    return userKey;
  }

  const environmentKey = process.env.OPENROUTER_API_KEY?.trim();
  if (environmentKey) {
    return environmentKey;
  }

  throw new ConfigurationError(
    "OpenRouter API key not found. Provide OPENROUTER_API_KEY via the server environment or enter it in the app.",
  );
}

/** Port of `build_tools_definition` in api_utils.py. */
export function buildToolsDefinition() {
  const chartNames = getChartNames();
  const chartCategories = [
    ...new Set(loadVisualVocabulary().charts.map((chart) => chart.category ?? "Uncategorized")),
  ].sort();

  return [
    {
      type: "function",
      function: {
        name: "recommend_graphs",
        description:
          "Recommend graphs for the user's data visualization needs. " +
          "Call this function to provide structured graph recommendations.",
        parameters: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              description: "List of 2-3 graph recommendations",
              items: {
                type: "object",
                properties: {
                  chart_name: {
                    type: "string",
                    description: "The chart type name from the Visual Vocabulary",
                    enum: chartNames,
                  },
                  category: {
                    type: "string",
                    description: "Category of the selected chart type",
                    enum: chartCategories,
                  },
                  x_axis: {
                    type: "string",
                    description: "What should be on the X-axis",
                  },
                  y_axis: {
                    type: "string",
                    description: "What should be on the Y-axis",
                  },
                  legend: {
                    type: "string",
                    description: "What information should be in the legend",
                  },
                  justification: {
                    type: "string",
                    description: "2-3 sentence explanation of why this graph type is ideal",
                  },
                },
                required: ["chart_name", "category", "x_axis", "y_axis", "legend", "justification"],
              },
              minItems: 2,
              maxItems: 3,
            },
          },
          required: ["recommendations"],
        },
      },
    },
  ];
}

interface ToolCall {
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content?: string | null;
      tool_calls?: ToolCall[];
    };
  }[];
}

interface CallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

/** Port of `call_openrouter_api_with_tools` in api_utils.py, including its error messages. */
export async function callOpenRouterWithTools(
  prompt: string,
  { model = MODEL_NAME, temperature = 0.7, maxTokens = 2000, apiKey }: CallOptions = {},
): Promise<RecommendationResult> {
  const resolvedApiKey = resolveOpenRouterApiKey(apiKey);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resolvedApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        tools: buildToolsDefinition(),
        tool_choice: { type: "function", function: { name: "recommend_graphs" } },
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new OpenRouterError("API request timed out. Please try again.");
    }
    throw new OpenRouterError(`Error calling API: ${errorMessage(error)}`);
  }

  if (!response.ok) {
    throw new OpenRouterError(`API Error: ${await httpErrorDetail(response)}`);
  }

  try {
    const result = (await response.json()) as ChatCompletionResponse;
    const message = result.choices[0].message;
    let recommendations: Recommendation[] = [];

    for (const toolCall of message.tool_calls ?? []) {
      if (toolCall.function.name !== "recommend_graphs") {
        continue;
      }
      let toolArguments: { recommendations?: Recommendation[] };
      try {
        toolArguments = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        throw new OpenRouterError(`Error parsing tool response: ${errorMessage(error)}`);
      }
      recommendations = (toolArguments.recommendations ?? []).map(enrichRecommendation);
    }

    return { recommendations, rawResponse: message.content ?? "" };
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error;
    }
    throw new OpenRouterError(`Error calling API: ${errorMessage(error)}`);
  }
}

function enrichRecommendation(recommendation: Recommendation): Recommendation {
  const chart = getChartByName(recommendation.chart_name);
  if (!chart) {
    return recommendation;
  }
  return {
    ...recommendation,
    icon: chart.icon,
    category: chart.category,
    chart_description: chart.description,
  };
}

async function httpErrorDetail(response: Response): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`.trim();
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
