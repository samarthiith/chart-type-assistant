import { connection } from "next/server";

import { isOpenRouterApiKeyConfigured } from "@/server/openRouter";
import { buildGraphSelectionPrompt } from "@/server/prompt";
import { PROMPT_TEMPLATE_DATA_DESCRIPTION, PROMPT_TEMPLATE_KEY_MESSAGE } from "@/shared/constants";
import HomePage from "@/views/HomePage/HomePage";

export default async function Page() {
  // Read the API key setting at request time rather than baking it in at build time.
  await connection();

  return (
    <HomePage
      serverKeyConfigured={isOpenRouterApiKeyConfigured()}
      promptTemplate={buildGraphSelectionPrompt(PROMPT_TEMPLATE_KEY_MESSAGE, PROMPT_TEMPLATE_DATA_DESCRIPTION)}
    />
  );
}
