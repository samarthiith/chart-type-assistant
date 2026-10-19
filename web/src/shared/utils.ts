/**
 * Formats a chart name the way the Streamlit app does: `name.replace("-", " ").title()`.
 * Python's `title()` upper-cases the first letter of each run of letters and lower-cases the rest.
 */
export function formatChartName(chartName: string): string {
  return chartName
    .replaceAll("-", " ")
    .replace(/[a-z]+/gi, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function iconUrl(iconFile: string): string {
  return `/icons/${encodeURIComponent(iconFile)}`;
}
