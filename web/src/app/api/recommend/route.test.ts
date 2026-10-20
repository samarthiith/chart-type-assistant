// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/recommend/route";

function postRequest(body: unknown) {
  return new Request("http://localhost/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = { keyMessage: "Solar grew fastest", dataDescription: "Annual generation by source" };

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "");
});

describe("POST /api/recommend", () => {
  it.each([
    [{ keyMessage: "  ", dataDescription: "data" }, "Please enter a key message"],
    [{ keyMessage: "message", dataDescription: "" }, "Please describe your data"],
  ])("rejects incomplete input %j", async (body, message) => {
    const response = await POST(postRequest(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { kind: "validation", message } });
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(postRequest("not json"));

    expect(response.status).toBe(400);
    expect((await response.json()).error.kind).toBe("validation");
  });

  it("returns a configuration error when no API key is available", async () => {
    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error.kind).toBe("configuration");
  });

  it("returns recommendations using the server key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "server-key");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: "",
              tool_calls: [
                {
                  function: {
                    name: "recommend_graphs",
                    arguments: JSON.stringify({ recommendations: [{ chart_name: "bar", category: "Magnitude" }] }),
                  },
                },
              ],
            },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.recommendations[0]).toMatchObject({ chart_name: "bar", icon: "bar-magnitude.svg" });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer server-key");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content).toContain("Solar grew fastest");
  });

  it("uses the key entered by the user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: "" } }] }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(postRequest({ ...validBody, apiKey: "user-key" }));

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer user-key");
  });

  it("returns upstream failures as request errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: { message: "Rate limited" } }, { status: 429 })),
    );

    const response = await POST(postRequest({ ...validBody, apiKey: "user-key" }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: { kind: "request", message: "API Error: Rate limited" } });
  });
});
