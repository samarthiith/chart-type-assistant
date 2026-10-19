"""
Regenerate the fixtures that keep the web app's prompt and tool schema identical to the Streamlit app.

Run from the repository root with the Streamlit app's dependencies installed:

    python web/scripts/generate_parity_fixtures.py
"""

import json
import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FIXTURES_DIR = os.path.join(REPO_ROOT, "web", "src", "server", "__fixtures__")

sys.path.insert(0, REPO_ROOT)

from api_utils import build_graph_selection_prompt, build_tools_definition  # noqa: E402

SAMPLE_KEY_MESSAGE = "Solar's share grew faster than wind's \"in 2024\"\n— see note\\"
SAMPLE_DATA_DESCRIPTION = "Annual generation (MWh) by source, 2019–2024"

os.makedirs(FIXTURES_DIR, exist_ok=True)

with open(os.path.join(FIXTURES_DIR, "prompt-template.txt"), "w", encoding="utf-8") as f:
    f.write(build_graph_selection_prompt("<INPUT_KEY_MESSAGE>", "<INPUT_DATA_DESCRIPTION>"))

with open(os.path.join(FIXTURES_DIR, "prompt-sample.json"), "w", encoding="utf-8") as f:
    json.dump(
        {
            "keyMessage": SAMPLE_KEY_MESSAGE,
            "dataDescription": SAMPLE_DATA_DESCRIPTION,
            "prompt": build_graph_selection_prompt(SAMPLE_KEY_MESSAGE, SAMPLE_DATA_DESCRIPTION),
        },
        f,
        ensure_ascii=False,
        indent=2,
    )

with open(os.path.join(FIXTURES_DIR, "tools-definition.json"), "w", encoding="utf-8") as f:
    json.dump(build_tools_definition(), f, ensure_ascii=False, indent=2)

print(f"Fixtures written to {FIXTURES_DIR}")
