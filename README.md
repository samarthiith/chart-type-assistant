# Chart Type Assistant

This app us AI to give recommendations of chart type based on the message/relationship you want to highlight. 

*"Graphs show relationships not data."* - Alan Smith (📚 [How Charts Work](https://www.goodreads.com/book/show/63127668-how-charts-work))

 [FT Interactive Visual Vocabulary](https://ft-interactive.github.io/visual-vocabulary/) is a great resource providing overview of different chart types. 
## Features

- AI-powered graph type recommendations
- Gemini 3 (via OpenRouter) for fast, structured recommendations
- Integration with FT Visual Vocabulary chart taxonomy
- Explanations with axes, legends, and chart-specific rationale

## Setup

### Prerequisites

- Python 3.11+
- An OpenRouter API key ([get one here](https://openrouter.ai/))

### Installation

1. Clone the repository and enter the project directory:

```bash
cd graph-assistant
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure your API key (choose one):

- Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`
- Set `OPENROUTER_API_KEY` in Streamlit secrets (`.streamlit/secrets.toml`)
- Enter the key directly in the app sidebar at runtime

### Run the app

```bash
streamlit run app.py
```

The app will open at [http://localhost:8501](http://localhost:8501).

## Usage

1. Enter the key message/relationship you want the chart to communicate.
2. Describe your dataset.
3. Click **Get Recommendations**.
4. Review 2-3 suggested chart types with implementation guidance.

## Project Structure

- `app.py`: Streamlit UI and user interaction flow
- `api_utils.py`: Prompt construction, OpenRouter API calls, response parsing
- `graphs/visual_vocabulary.json`: Chart taxonomy and metadata used for tool constraints
- `graphs/graphs/`: SVG icons shown with recommendations

## License

MIT License. See `LICENSE`.
