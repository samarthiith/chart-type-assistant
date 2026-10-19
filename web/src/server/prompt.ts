import { pythonRepr } from "@/server/pythonRepr";
import { loadVisualVocabulary } from "@/server/vocabulary";

/** Port of `build_graph_selection_prompt` in api_utils.py. Keep the wording identical. */
export function buildGraphSelectionPrompt(keyMessage: string, dataDescription: string): string {
  const vocabulary = pythonRepr(loadVisualVocabulary());

  return `You are an expert data visualization advisor for energy policy analysts.
Your task is to recommend the most appropriate graph types from the FT Visual Vocabulary.
Pay attention if the user input is incomplete or unclear.
If this is the case, ask user to clarify their request and give category "Uncategorized" chart recommendations.

KEY MESSAGE TO COMMUNICATE:
${keyMessage}

DATA DESCRIPTION:
${dataDescription}

AVAILABLE CHART TYPES and their descriptions:
${vocabulary}

TARGET AUDIENCE:
Energy policy analysts who need clear, professional visualizations for technical reports and presentations.

TASK:
Use the recommend_graphs tool to provide 2-3 graph recommendations. For each recommendation:
1. Select a chart_name from the available options above
2. Include the category that matches the selected chart_name
3. Specify what goes on the X-axis and Y-axis
4. Describe what should be in the legend
5. Provide a 2-3 sentence justification explaining why this chart type is ideal for communicating the key message

Focus on clarity, relevance to energy policy analysis, and adherence to data visualization best practices.`;
}
