import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RecommendationCard from "@/components/RecommendationCard/RecommendationCard";

describe("RecommendationCard", () => {
  it("shows the chart, its rationale and the axis mapping", () => {
    render(
      <RecommendationCard
        index={1}
        recommendation={{
          chart_name: "column-grouped",
          category: "Magnitude",
          x_axis: "Year",
          y_axis: "Generation (MWh)",
          legend: "Energy source",
          justification: "Compares sources side by side.",
          icon: "column-grouped.svg",
          chart_description: "Compare values across categories.",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Column Grouped" })).toBeInTheDocument();
    expect(screen.getByText("Magnitude")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Column Grouped chart" })).toHaveAttribute(
      "src",
      expect.stringMatching(/\/icons\/column-grouped\.svg$/),
    );
    expect(screen.getByText("Compare values across categories.")).toBeInTheDocument();
    expect(screen.getByText("Compares sources side by side.")).toBeInTheDocument();
    expect(screen.getByText("Year")).toBeInTheDocument();
    expect(screen.getByText("Generation (MWh)")).toBeInTheDocument();
    expect(screen.getByText("Energy source")).toBeInTheDocument();
  });

  it("uses the Streamlit fallbacks for missing fields", () => {
    render(
      <RecommendationCard
        index={2}
        recommendation={{ chart_name: "", category: "", x_axis: "", y_axis: "", legend: "", justification: "" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Unknown" })).toBeInTheDocument();
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
    expect(screen.getByText("Image not found")).toBeInTheDocument();
    expect(screen.getByText("No justification provided.")).toBeInTheDocument();
    expect(screen.getAllByText("Not specified")).toHaveLength(3);
  });
});
