"""
Utilities for interacting with Open Router API
"""

import json
import os
from typing import Any, Dict, List, Optional

import requests
import streamlit as st
from dotenv import load_dotenv

# Path to icons
ICONS_PATH = os.path.join(os.path.dirname(__file__), "graphs", "icons")

load_dotenv()

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Path to visual vocabulary data
VISUAL_VOCAB_PATH = os.path.join(
    os.path.dirname(__file__), "graphs", "visual_vocabulary.json"
)


def is_openrouter_api_key_configured() -> bool:
    """Return True if OPENROUTER_API_KEY is available in env or Streamlit secrets."""
    if os.getenv("OPENROUTER_API_KEY", "").strip():
        return True
    try:
        return bool(str(st.secrets.get("OPENROUTER_API_KEY", "")).strip())
    except Exception:
        return False


def resolve_openrouter_api_key(api_key: Optional[str] = None) -> str:
    """Resolve OpenRouter API key from user input, environment, or Streamlit secrets."""
    if api_key and api_key.strip():
        return api_key.strip()

    env_key = os.getenv("OPENROUTER_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()

    try:
        secret_key = st.secrets["OPENROUTER_API_KEY"]
        if secret_key and str(secret_key).strip():
            return str(secret_key).strip()
    except Exception:
        pass

    raise ValueError(
        "OpenRouter API key not found. Provide OPENROUTER_API_KEY via env/secrets or enter it in the app sidebar."
    )


def load_visual_vocabulary() -> Dict[str, Any]:
    """Load the visual vocabulary JSON file."""
    with open(VISUAL_VOCAB_PATH, "r") as f:
        return json.load(f)


def get_chart_names() -> List[str]:
    """Get list of all chart names from visual vocabulary."""
    vocab = load_visual_vocabulary()
    return [chart["name"] for chart in vocab["charts"]]


def get_chart_by_name(name: str) -> Optional[Dict[str, Any]]:
    """Get chart details by name."""
    vocab = load_visual_vocabulary()
    for chart in vocab["charts"]:
        if chart["name"] == name:
            return chart
    return None


def build_tools_definition() -> List[Dict[str, Any]]:
    """Build the tools definition for the API call."""
    chart_names = get_chart_names()
    vocab = load_visual_vocabulary()
    chart_categories = sorted(
        {chart.get("category", "Uncategorized") for chart in vocab.get("charts", [])}
    )

    return [
        {
            "type": "function",
            "function": {
                "name": "recommend_graphs",
                "description": "Recommend graphs for the user's data visualization needs. Call this function to provide structured graph recommendations.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "recommendations": {
                            "type": "array",
                            "description": "List of 2-3 graph recommendations",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "chart_name": {
                                        "type": "string",
                                        "description": "The chart type name from the Visual Vocabulary",
                                        "enum": chart_names,
                                    },
                                    "category": {
                                        "type": "string",
                                        "description": "Category of the selected chart type",
                                        "enum": chart_categories,
                                    },
                                    "x_axis": {
                                        "type": "string",
                                        "description": "What should be on the X-axis",
                                    },
                                    "y_axis": {
                                        "type": "string",
                                        "description": "What should be on the Y-axis",
                                    },
                                    "legend": {
                                        "type": "string",
                                        "description": "What information should be in the legend",
                                    },
                                    "justification": {
                                        "type": "string",
                                        "description": "2-3 sentence explanation of why this graph type is ideal",
                                    },
                                },
                                "required": [
                                    "chart_name",
                                    "category",
                                    "x_axis",
                                    "y_axis",
                                    "legend",
                                    "justification",
                                ],
                            },
                            "minItems": 2,
                            "maxItems": 3,
                        }
                    },
                    "required": ["recommendations"],
                },
            },
        }
    ]


def call_openrouter_api(
    prompt: str,
    model: str = "google/gemini-3-flash-preview",
    temperature: float = 0.7,
    max_tokens: int = 2000,
    api_key: Optional[str] = None,
) -> Optional[str]:
    """
    Call Open Router API with the provided prompt and model.

    Args:
        prompt: The prompt to send to the model
        model: The model to use
        temperature: Temperature for response generation
        max_tokens: Maximum tokens in response
        api_key: Optional API key override

    Returns:
        The model's response text or None if an error occurred
    """
    resolved_api_key = resolve_openrouter_api_key(api_key)

    headers = {
        "Authorization": f"Bearer {resolved_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        response = requests.post(
            OPENROUTER_API_URL, headers=headers, json=payload, timeout=30
        )
        response.raise_for_status()

        result = response.json()
        return result["choices"][0]["message"]["content"]

    except requests.exceptions.Timeout:
        raise Exception("API request timed out. Please try again.")
    except requests.exceptions.HTTPError as e:
        error_detail = e.response.json().get("error", {}).get("message", str(e))
        raise Exception(f"API Error: {error_detail}")
    except Exception as e:
        raise Exception(f"Error calling API: {str(e)}")


def call_openrouter_api_with_tools(
    prompt: str,
    model: str = "google/gemini-3-flash-preview",
    temperature: float = 0.7,
    max_tokens: int = 2000,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Call Open Router API with tool calling support.

    Returns:
        Dictionary with 'recommendations' (list of chart recommendations with details)
        and 'raw_response' (any additional text from the model)
    """
    resolved_api_key = resolve_openrouter_api_key(api_key)

    headers = {
        "Authorization": f"Bearer {resolved_api_key}",
        "Content-Type": "application/json",
    }

    tools = build_tools_definition()

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "tools": tools,
        "tool_choice": {"type": "function", "function": {"name": "recommend_graphs"}},
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        response = requests.post(
            OPENROUTER_API_URL, headers=headers, json=payload, timeout=60
        )
        response.raise_for_status()

        result = response.json()
        message = result["choices"][0]["message"]

        recommendations = []
        raw_response = message.get("content", "")

        if "tool_calls" in message:
            for tool_call in message["tool_calls"]:
                if tool_call["function"]["name"] == "recommend_graphs":
                    args = json.loads(tool_call["function"]["arguments"])
                    recommendations = args.get("recommendations", [])

                    for rec in recommendations:
                        chart_info = get_chart_by_name(rec["chart_name"])
                        if chart_info:
                            rec["icon"] = chart_info["icon"]
                            rec["category"] = chart_info["category"]
                            rec["chart_description"] = chart_info["description"]

        return {"recommendations": recommendations, "raw_response": raw_response}

    except requests.exceptions.Timeout:
        raise Exception("API request timed out. Please try again.")
    except requests.exceptions.HTTPError as e:
        error_detail = e.response.json().get("error", {}).get("message", str(e))
        raise Exception(f"API Error: {error_detail}")
    except json.JSONDecodeError as e:
        raise Exception(f"Error parsing tool response: {str(e)}")
    except Exception as e:
        raise Exception(f"Error calling API: {str(e)}")


def build_graph_selection_prompt(
    key_message: str,
    data_description: str,
) -> str:
    """
    Build a structured prompt for graph selection recommendation.

    Args:
        key_message: The key message to communicate with the graph
        data_description: Description of the data for the graph

    Returns:
        The formatted prompt for the AI model
    """
    vocab = load_visual_vocabulary()

    prompt = f"""You are an expert data visualization advisor for energy policy analysts.
Your task is to recommend the most appropriate graph types from the FT Visual Vocabulary.
Pay attention if the user input is incomplete or unclear.
If this is the case, ask user to clarify their request and give category "Uncategorized" chart recommendations.

KEY MESSAGE TO COMMUNICATE:
{key_message}

DATA DESCRIPTION:
{data_description}

AVAILABLE CHART TYPES and their descriptions:
{vocab}

TARGET AUDIENCE:
Energy policy analysts who need clear, professional visualizations for technical reports and presentations.

TASK:
Use the recommend_graphs tool to provide 2-3 graph recommendations. For each recommendation:
1. Select a chart_name from the available options above
2. Include the category that matches the selected chart_name
3. Specify what goes on the X-axis and Y-axis
4. Describe what should be in the legend
5. Provide a 2-3 sentence justification explaining why this chart type is ideal for communicating the key message

Focus on clarity, relevance to energy policy analysis, and adherence to data visualization best practices."""

    return prompt


def display_recommendation(rec: dict, index: int):
    """Display a single recommendation with its icon."""
    chart_name = rec.get("chart_name", "Unknown")
    icon_file = rec.get("icon", "")
    x_axis = rec.get("x_axis", "")
    y_axis = rec.get("y_axis", "")
    legend = rec.get("legend", "")
    category = rec.get("category", "Uncategorized")
    justification = rec.get("justification", "")
    chart_description = rec.get("chart_description", "")

    with st.container(border=True):
        st.markdown(
            f"### {chart_name.replace('-', ' ').title()} [Category: *{category}*]"
        )
        # st.caption(f"Category: {category}")
        icon_col, details_col = st.columns([1, 3], vertical_alignment="top")
        with icon_col:
            icon_path = os.path.join(ICONS_PATH, icon_file)
            if os.path.exists(icon_path):
                st.image(icon_path, use_container_width=True)
            else:
                st.caption("Image not found")

        with details_col:
            if chart_description:
                st.write(f"*{chart_description}*")
            st.write("**Why this chart works**")
            st.write(justification or "No justification provided.")

        axis_col, legend_col = st.columns(2)
        with axis_col:
            st.write("**Axis mapping**")
            st.write(f"**X-axis:** {x_axis or 'Not specified'}")
            st.write(f"**Y-axis:** {y_axis or 'Not specified'}")
        with legend_col:
            st.write("**Legend**")
            st.write(legend or "Not specified")
