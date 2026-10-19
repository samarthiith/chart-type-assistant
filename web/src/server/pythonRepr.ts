/**
 * Serialises JSON-compatible values the way Python's `repr()` does.
 * The Streamlit app interpolates the vocabulary dict straight into its prompt, so the web app must match it exactly.
 */
export function pythonRepr(value: unknown): string {
  if (value === null || value === undefined) {
    return "None";
  }
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return reprString(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(pythonRepr).join(", ")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).map(([key, entry]) => `${reprString(key)}: ${pythonRepr(entry)}`);
    return `{${entries.join(", ")}}`;
  }
  throw new TypeError(`Cannot represent value of type ${typeof value}`);
}

const NON_PRINTABLE = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}\p{Zs}]/u;

function reprString(text: string): string {
  const quote = text.includes("'") && !text.includes('"') ? '"' : "'";
  let result = quote;

  for (const character of text) {
    if (character === quote || character === "\\") {
      result += `\\${character}`;
    } else if (character === "\n") {
      result += "\\n";
    } else if (character === "\r") {
      result += "\\r";
    } else if (character === "\t") {
      result += "\\t";
    } else if (character !== " " && NON_PRINTABLE.test(character)) {
      result += escapeCodePoint(character.codePointAt(0) ?? 0);
    } else {
      result += character;
    }
  }

  return result + quote;
}

function escapeCodePoint(codePoint: number): string {
  if (codePoint <= 0xff) {
    return `\\x${codePoint.toString(16).padStart(2, "0")}`;
  }
  if (codePoint <= 0xffff) {
    return `\\u${codePoint.toString(16).padStart(4, "0")}`;
  }
  return `\\U${codePoint.toString(16).padStart(8, "0")}`;
}
