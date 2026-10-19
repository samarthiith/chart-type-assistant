import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import InfoTip from "@/components/InfoTip/InfoTip";

describe("InfoTip", () => {
  it("describes its trigger with the tooltip text", () => {
    render(<InfoTip id="tip" text="Helpful detail" />);

    expect(screen.getByRole("button", { name: "More information" })).toHaveAccessibleDescription("Helpful detail");
    expect(screen.getByRole("tooltip")).toHaveAttribute("id", "tip");
  });

  it("gives up focus on Escape so the tooltip hides", async () => {
    render(<InfoTip id="tip" text="Helpful detail" />);
    const trigger = screen.getByRole("button", { name: "More information" });

    await userEvent.tab();
    expect(trigger).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    expect(trigger).not.toHaveFocus();
  });
});
