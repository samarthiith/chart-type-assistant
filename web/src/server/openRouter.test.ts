// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildToolsDefinition,
  callOpenRouterWithTools,
  ConfigurationError,
  isOpenRouterApiKeyConfigured,
  OPENROUTER_API_URL,
  OpenRouterError,
  resolveOpenRouterApiKey,
} from "@/server/openRouter";

import toolsDefinition from "./__fixtures__/tools-definition.json";

function toolCallResponse(recommendations: unknown[], content: string | null = null) {
  return Response.json({
    choices: [
      {
        message: {
          content,
          tool_calls: [
            { function: { name: "recommend_graphs", arguments: JSON.stringify({ recommendations }) } },
          ],
        },
      },
    ],
  });
}

const recommendation = {
  chart_name: "line",
  category: "Magnitude",
  x_axis: "Year",
  y_axis: "Generation (MWh)",
  legend: "Energy source",
  justification: "Shows change over time.",
};

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "");
});

describe("buildToolsDefinition", () => {
  it("matches the Streamlit tool schema exactly", () => {
    expect(buildToolsDefinition()).toEqual(toolsDefinition);
  });
});

describe("API key resolution", () => {
  it("prefers the user's key over the server key", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "server-key");
    expect(resolveOpenRouterApiKey("  user-key  ")).toBe("user-key");
  });

  it("falls back to the server key", () => {
    vi.stubEnv("OPENROUTER_API_KEY", " server-key ");
    expect(resolveOpenRouterApiKey("   ")).toBe("server-key");
    expect(isOpenRouterApiKeyConfigured()).toBe(true);
  });

  it("throws a configuration error when no key is available", () => {
    expect(isOpenRouterApiKeyConfigured()).toBe(false);
    expect(() => resolveOpenRouterApiKey()).toThrow(ConfigurationError);
    expect(() => resolveOpenRouterApiKey()).toThrow(
      "OpenRouter API key not found. Provide OPENROUTER_API_KEY via the server environment or enter it in the app.",
    );
  });
});

describe("callOpenRouterWithTools", () => {
  it("sends the same request as the Streamlit app", async () => {
    const fetchMock = vi.fn().mockResolvedValue(toolCallResponse([recommendation]));
    vi.stubGlobal("fetch", fetchMock);

    await callOpenRouterWithTools("the prompt", { apiKey: "user-key" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(OPENROUTER_API_URL);
    expect(init.headers).toEqual({ Authorization: "Bearer user-key", "Content-Type": "application/json" });
    expect(JSON.parse(init.body)).toEqual({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: "the prompt" }],
      tools: toolsDefinition,
      tool_choice: { type: "function", function: { name: "recommend_graphs" } },
      temperature: 0.7,
      max_tokens: 2000,
    });
  });

  it("enriches known charts with vocabulary details", async () => {
    const unknownChart = { ...recommendation, chart_name: "made-up", category: "Spatial" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(toolCallResponse([recommendation, unknownChart], "note")));

    const result = await callOpenRouterWithTools("prompt", { apiKey: "key" });

    expect(result.rawResponse).toBe("note");
    expect(result.recommendations[0]).toMatchObject({
      chart_name: "line",
      category: "Change v Time",
      icon: "line.svg",
      chart_description: expect.any(String),
    });
    expect(result.recommendations[1]).toEqual(unknownChart);
  });

  it("returns no recommendations when the model makes no tool call", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: "Please clarify." } }] })),
    );

    await expect(callOpenRouterWithTools("prompt", { apiKey: "key" })).resolves.toEqual({
      recommendations: [],
      rawResponse: "Please clarify.",
    });
  });

  it("reports the API's error message on HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: { message: "User not found." } }, { status: 401 })),
    );

    await expect(callOpenRouterWithTools("prompt", { apiKey: "key" })).rejects.toThrow("API Error: User not found.");
  });

  it("falls back to the HTTP status when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("oops", { status: 502, statusText: "Bad Gateway" })),
    );

    await expect(callOpenRouterWithTools("prompt", { apiKey: "key" })).rejects.toThrow("API Error: 502 Bad Gateway");
  });

  it("reports timeouts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")));

    await expect(callOpenRouterWithTools("prompt", { apiKey: "key" })).rejects.toThrow(
      "API request timed out. Please try again.",
    );
  });

  it("reports malformed tool arguments", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [{ message: { tool_calls: [{ function: { name: "recommend_graphs", arguments: "{oops" } }] } }],
        }),
      ),
    );

    const call = callOpenRouterWithTools("prompt", { apiKey: "key" });
    await expect(call).rejects.toThrow(OpenRouterError);
    await expect(call).rejects.toThrow(/^Error parsing tool response: /);
  });

  it("reports unexpected response shapes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ choices: [] })));

    await expect(callOpenRouterWithTools("prompt", { apiKey: "key" })).rejects.toThrow(/^Error calling API: /);
  });

  it("does not call the API without a key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(callOpenRouterWithTools("prompt")).rejects.toThrow(ConfigurationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
