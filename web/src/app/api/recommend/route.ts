import { buildGraphSelectionPrompt } from "@/server/prompt";
import { callOpenRouterWithTools, ConfigurationError } from "@/server/openRouter";
import type { RecommendErrorBody, RecommendErrorKind, RecommendRequestBody } from "@/shared/types";

export async function POST(request: Request) {
  let body: Partial<RecommendRequestBody>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("validation", "Request body must be JSON.", 400);
  }

  const keyMessage = typeof body.keyMessage === "string" ? body.keyMessage : "";
  const dataDescription = typeof body.dataDescription === "string" ? body.dataDescription : "";
  const apiKey = typeof body.apiKey === "string" ? body.apiKey : undefined;

  if (!keyMessage.trim()) {
    return errorResponse("validation", "Please enter a key message", 400);
  }
  if (!dataDescription.trim()) {
    return errorResponse("validation", "Please describe your data", 400);
  }

  try {
    const prompt = buildGraphSelectionPrompt(keyMessage, dataDescription);
    const result = await callOpenRouterWithTools(prompt, { apiKey });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return errorResponse("configuration", error.message, 400);
    }
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse("request", message, 502);
  }
}

function errorResponse(kind: RecommendErrorKind, message: string, status: number) {
  const body: RecommendErrorBody = { error: { kind, message } };
  return Response.json(body, { status });
}
