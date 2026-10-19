// Copies the shared chart vocabulary and icons from ../graphs so the Streamlit app and the web app use one source.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const graphsRoot = join(webRoot, "..", "graphs");

const dataDir = join(webRoot, "src", "data");
const iconsDir = join(webRoot, "public", "icons");

mkdirSync(dataDir, { recursive: true });
cpSync(join(graphsRoot, "visual_vocabulary.json"), join(dataDir, "visual_vocabulary.json"));

rmSync(iconsDir, { recursive: true, force: true });
cpSync(join(graphsRoot, "icons"), iconsDir, { recursive: true });

console.log("Synced graphs/visual_vocabulary.json and graphs/icons into web/");
