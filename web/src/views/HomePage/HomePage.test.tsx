import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/views/HomePage/HomePage";

function renderHomePage(serverKeyConfigured = true) {
  render(<HomePage serverKeyConfigured={serverKeyConfigured} promptTemplate="template" />);
}

async function fillForm() {
  await userEvent.type(screen.getByLabelText("Key message / relationship"), "Solar grew fastest");
  await userEvent.type(screen.getByLabelText("Data description"), "Annual generation by source");
}

const submitButton = () => screen.getByRole("button", { name: "Get Recommendations" });

describe("HomePage", () => {
  it("asks for an API key only when the server has none", () => {
    renderHomePage(false);
    expect(screen.getByLabelText("OpenRouter API key")).toHaveAttribute("type", "password");
    cleanup();

    renderHomePage(true);
    expect(screen.queryByLabelText("OpenRouter API key")).not.toBeInTheDocument();
  });

  it("warns that recommendations are AI-generated", () => {
    renderHomePage();

    expect(screen.getByText("Recommendations are AI-generated and may not always be accurate.")).toBeInTheDocument();
  });

  it("validates the key message, then the data description, without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderHomePage();

    await userEvent.click(submitButton());
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a key message");

    await userEvent.type(screen.getByLabelText("Key message / relationship"), "Solar grew fastest");
    await userEvent.click(submitButton());
    expect(screen.getByRole("alert")).toHaveTextContent("Please describe your data");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows recommendations from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        rawResponse: "",
        recommendations: [
          {
            chart_name: "line",
            category: "Change v Time",
            x_axis: "Year",
            y_axis: "MWh",
            legend: "Source",
            justification: "Shows the trend.",
            icon: "line.svg",
          },
          {
            chart_name: "column-grouped",
            category: "Magnitude",
            x_axis: "Year",
            y_axis: "MWh",
            legend: "Source",
            justification: "Compares sources.",
            icon: "column-grouped.svg",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderHomePage(false);

    await userEvent.type(screen.getByLabelText("OpenRouter API key"), " user-key ");
    await fillForm();
    await userEvent.click(submitButton());

    expect(await screen.findByText("Recommendations generated!")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Line" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Column Grouped" })).toBeInTheDocument();
    expect(screen.getByText("Need more help?")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      keyMessage: "Solar grew fastest",
      dataDescription: "Annual generation by source",
      apiKey: "user-key",
    });
  });

  it("disables the button while the request is running", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    renderHomePage();

    await fillForm();
    await userEvent.click(submitButton());

    expect(submitButton()).toBeDisabled();
    expect(screen.getByText("Analyzing your data and generating recommendations...")).toBeInTheDocument();
  });

  it("explains configuration errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ error: { kind: "configuration", message: "OpenRouter API key not found." } }, { status: 400 }),
      ),
    );
    renderHomePage(false);

    await fillForm();
    await userEvent.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Configuration Error: OpenRouter API key not found.");
    expect(screen.getByText(/enter your key in the API key field/)).toBeInTheDocument();
  });

  it("shows request errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ error: { kind: "request", message: "API Error: Rate limited" } }, { status: 502 }),
      ),
    );
    renderHomePage();

    await fillForm();
    await userEvent.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Error: API Error: Rate limited");
    expect(screen.getByText("Please check your API key and try again.")).toBeInTheDocument();
  });
});
