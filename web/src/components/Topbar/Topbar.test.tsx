import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Topbar from "@/components/Topbar/Topbar";

describe("Topbar", () => {
  it("names the model in use", () => {
    render(<Topbar promptTemplate="" />);

    expect(screen.getByText("google/gemini-3-flash-preview via OpenRouter")).toBeInTheDocument();
  });

  it("opens and closes the About dialog", async () => {
    render(<Topbar promptTemplate="" />);

    await userEvent.click(screen.getByRole("button", { name: "About" }));
    expect(screen.getByRole("dialog", { name: "About This Tool" })).toHaveTextContent(
      "It does not perform internet search and relies on model knowledge.",
    );

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "About This Tool" })).not.toBeInTheDocument();
  });

  it("shows the prompt template", async () => {
    render(<Topbar promptTemplate="PROMPT BODY" />);

    await userEvent.click(screen.getByRole("button", { name: "Prompt template" }));

    expect(screen.getByRole("dialog", { name: "Prompt Template" })).toHaveTextContent("PROMPT BODY");
  });
});
