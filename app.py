import streamlit as st

from api_utils import (
    build_graph_selection_prompt,
    call_openrouter_api_with_tools,
    display_recommendation,
    is_openrouter_api_key_configured,
)

MODEL_NAME = "google/gemini-3-flash-preview"

# Page configuration
st.set_page_config(
    page_title="Chart Type Assistant",
    page_icon=":material/robot:",
    layout="wide",
)

st.header(
    """Chart Type Assistant :material/bar_chart: :material/show_chart: :material/scatter_plot:"""
)
st.write(
    "This tool uses AI to recommend the best types of charts based on your key message and data."
)

# Info section about Visual Vocabulary
with st.container(border=True):
    st.write(
        """
    *"Graphs show relationships not data."* - Alan Smith (:books: [How Charts Work](https://www.goodreads.com/book/show/63127668-how-charts-work))

    [FT Interactive Visual Vocabulary](https://ft-interactive.github.io/visual-vocabulary/)
    is a comprehensive resource for chart types, their characteristics, and **relationships** they best represent
    """
    )

# User-provided API key fallback (only shown if key is not already configured)
if not is_openrouter_api_key_configured():
    user_api_key = st.sidebar.text_input(
        "OpenRouter API Key",
        type="password",
        help="Set OPENROUTER_API_KEY in your environment or Streamlit secrets to hide this field.",
    )
else:
    user_api_key = ""

st.sidebar.header(":material/notes: Explanation")
with st.sidebar:
    prompt_template = build_graph_selection_prompt(
        "<INPUT_KEY_MESSAGE>",
        "<INPUT_DATA_DESCRIPTION>",
    )

    @st.dialog(title="Prompt Template", width="large")
    def show_prompt_template():
        st.code(prompt_template, language="markdown", wrap_lines=True)

    @st.dialog(title="About This Tool", width="medium")
    def show_about_tool():
        st.markdown(
            f"""
### How It Works
- Your key message and data description are combined into a structured prompt.
- The tool sends that prompt to **{MODEL_NAME}** through OpenRouter.
- Tool calling is used so recommendations return in a structured format that can be parsed and matched to graph visuals.
- It does not perform internet search and relies on model knowledge.

### Developer
- This project is open source: [chart-type-assistant](https://github.com/samarthiith/chart-type-assistant)
- Feel free to report any bugs or feature suggestions via [github issues](https://github.com/samarthiith/chart-type-assistant/issues)
"""
        )

    st.button("About This Tool", use_container_width=True, on_click=show_about_tool)

    st.button(
        "Prompt Template", use_container_width=True, on_click=show_prompt_template
    )

st.sidebar.warning(
    """Recommendations are AI-generated and may not always be accurate.""",
    icon="⚠️",
)

# Main input section
col1, col2 = st.columns(2)

with col1:
    st.subheader(
        ":material/speaker_notes: Key message / relationship:",
        help="What is the relationship you want to show?",
    )
    key_message = st.text_area(
        "What is the key message you want to communicate with the graph?",
        placeholder="e.g., Solar energy has grown faster than wind energy in the last 5 years",
        height=100,
        label_visibility="collapsed",
    )

with col2:
    st.subheader(
        ":material/data_table: Data Description",
        help="Describe the data you have for the graph.",
    )
    data_description = st.text_area(
        "Describe the data for the graph. For example: yearly generation by fuel type.",
        placeholder="e.g., Annual electricity generation (MWh) from different renewable sources (solar, wind, hydro, geothermal) from 2019 to 2024",
        height=100,
        label_visibility="collapsed",
    )

# Button to get recommendations
get_recommendations = st.button(
    ":material/robot_2: Get Recommendations",
    type="primary",
    use_container_width=True,
)

# Process when button is clicked
if get_recommendations:
    if not key_message.strip():
        st.error("❌ Please enter a key message")
    elif not data_description.strip():
        st.error("❌ Please describe your data")
    else:
        try:
            with st.spinner("🤖 Analyzing your data and generating recommendations..."):
                prompt = build_graph_selection_prompt(key_message, data_description)
                result = call_openrouter_api_with_tools(
                    prompt,
                    model=MODEL_NAME,
                    api_key=user_api_key.strip() or None,
                )

            recommendations = result.get("recommendations", [])

            if recommendations:
                st.success("Recommendations generated!")
                for i, rec in enumerate(recommendations):
                    display_recommendation(rec, i + 1)

            st.info(
                """
                **Need more help?**

                Visit the [FT Interactive Visual Vocabulary](https://ft-interactive.github.io/visual-vocabulary/)
                to explore these chart types in detail and see examples of each visualization.
                """,
                icon="💡",
            )

        except ValueError as e:
            st.error(f"❌ Configuration Error: {str(e)}")
            st.info(
                "Set OPENROUTER_API_KEY in `.env` or Streamlit secrets, or provide it in the sidebar key field."
            )
        except Exception as e:
            st.error(f"❌ Error: {str(e)}")
            st.info("Please check your API key and try again.")
