import {
    existsSync,
    mkdirSync,
    copyFileSync,
    writeFileSync,
    readFileSync,
} from "fs";
import { join, dirname } from "path";

const VAULT = process.argv[2]?.startsWith("--vault=")
    ? process.argv[2].split("=")[1]
    : "test-vault";
const vaultRoot = join(process.cwd(), VAULT);
const pluginDir = join(vaultRoot, ".obsidian", "plugins", "full-calendar-plus");

function ensureDir(p) {
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function copyIfExists(src, dest) {
    if (existsSync(src)) {
        ensureDir(dirname(dest));
        copyFileSync(src, dest);
        console.log(`copied ${src} -> ${dest}`);
        return true;
    }
    return false;
}

// 1. create vault skeleton
ensureDir(vaultRoot);
ensureDir(join(vaultRoot, ".obsidian", "plugins"));
ensureDir(pluginDir);

// minimal .obsidian config so vault opens cleanly
const appJson = join(vaultRoot, ".obsidian", "app.json");
if (!existsSync(appJson)) {
    writeFileSync(
        appJson,
        JSON.stringify({ legacyEnabled: false }, null, "\t"),
    );
}

const communityPluginsJson = join(
    vaultRoot,
    ".obsidian",
    "community-plugins.json",
);
if (!existsSync(communityPluginsJson)) {
    writeFileSync(
        communityPluginsJson,
        JSON.stringify(["full-calendar-plus"], null, "\t"),
    );
} else {
    try {
        const list = JSON.parse(readFileSync(communityPluginsJson, "utf8"));
        if (!list.includes("full-calendar-plus")) {
            list.push("full-calendar-plus");
            writeFileSync(
                communityPluginsJson,
                JSON.stringify(list, null, "\t"),
            );
        }
    } catch {}
}

const corePluginsJson = join(vaultRoot, ".obsidian", "core-plugins.json");
if (!existsSync(corePluginsJson)) {
    writeFileSync(
        corePluginsJson,
        JSON.stringify(
            ["file-explorer", "global-search", "switcher"],
            null,
            "\t",
        ),
    );
}

// welcome note
const welcome = join(vaultRoot, "Welcome.md");
if (!existsSync(welcome)) {
    writeFileSync(
        welcome,
        `# Welcome to Full Calendar Plus test vault

Open Command Palette → "Open calendar" to test the Year (12-month) view.

- Desktop toolbar now has: Month | **Year** | Week | Day | List
- Settings → Full Calendar Plus → Desktop Initial View → Year

This vault is gitignored. Delete it anytime.
`,
    );
}

// 2. copy plugin assets (build first if needed)
const assets = [
    ["main.js", "main.js"],
    ["manifest.json", "manifest.json"],
    ["styles.css", "styles.css"],
    ["main.css", "styles.css"], // fallback: esbuild dev emits main.css
    ["versions.json", "versions.json"],
];

let copied = 0;
for (const [src, dest] of assets) {
    // for styles.css fallback, don't overwrite if already copied
    if (
        src === "main.css" &&
        copied &&
        existsSync(join(pluginDir, "styles.css"))
    )
        continue;
    if (copyIfExists(join(process.cwd(), src), join(pluginDir, dest))) {
        if (
            src === "main.js" ||
            src === "manifest.json" ||
            src === "styles.css" ||
            src === "main.css"
        )
            copied++;
    }
}

// ensure styles.css exists (create empty if neither styles.css nor main.css built)
if (!existsSync(join(pluginDir, "styles.css"))) {
    console.warn(
        "styles.css/main.css not found — run `pnpm run build` first, or an empty styles.css was created.",
    );
    writeFileSync(join(pluginDir, "styles.css"), "/* empty */\n");
}

console.log(`\nVault ready at ./${VAULT}`);
console.log(
    `Plugin installed at ./${VAULT}/.obsidian/plugins/full-calendar-plus/`,
);
console.log(`Open this folder as vault in Obsidian to test.`);
