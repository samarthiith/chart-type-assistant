import { describe, expect, it } from "vitest";

import { buildGraphSelectionPrompt } from "@/server/prompt";
import { PROMPT_TEMPLATE_DATA_DESCRIPTION, PROMPT_TEMPLATE_KEY_MESSAGE } from "@/shared/constants";

import promptSample from "./__fixtures__/prompt-sample.json";
import promptTemplate from "./__fixtures__/prompt-template.txt?raw";

// Fixtures come from the Python app (scripts/generate_parity_fixtures.py), so these tests fail if the prompts drift.
describe("buildGraphSelectionPrompt", () => {
  it("matches the Streamlit prompt template exactly", () => {
    expect(buildGraphSelectionPrompt(PROMPT_TEMPLATE_KEY_MESSAGE, PROMPT_TEMPLATE_DATA_DESCRIPTION)).toBe(
      promptTemplate,
    );
  });

  it("matches the Streamlit prompt for input with quotes, backslashes and non-ASCII text", () => {
    expect(buildGraphSelectionPrompt(promptSample.keyMessage, promptSample.dataDescription)).toBe(
      promptSample.prompt,
    );
  });
});
