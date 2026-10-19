import { describe, expect, it } from "vitest";

import { formatChartName, iconUrl } from "@/shared/utils";

describe("formatChartName", () => {
  // Expected values match Python's `name.replace("-", " ").title()`.
  it.each([
    ["bar-diverging-stacked", "Bar Diverging Stacked"],
    ["xy-heatmap", "Xy Heatmap"],
    ["3d-chart", "3D Chart"],
    ["McDONALD-x", "Mcdonald X"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatChartName(input)).toBe(expected);
  });
});

describe("iconUrl", () => {
  it("encodes file names with spaces", () => {
    expect(iconUrl("parallel coordinates.svg")).toBe("/icons/parallel%20coordinates.svg");
  });
});
