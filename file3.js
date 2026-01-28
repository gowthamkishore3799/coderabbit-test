// random-cli-tool.js
// Run: node random-cli-tool.js --file ./notes.txt --mode stats
//      node random-cli-tool.js --file ./notes.txt --mode watch
//      node random-cli-tool.js --file ./notes.txt --mode transform --out ./out.txt

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

function parseArgs(argv) {
  const out = { file: null, mode: "stats", outFile: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--file" || a === "-f") out.file = argv[++i];
    else if (a === "--mode" || a === "-m") out.mode = argv[++i];
    else if (a === "--out" || a === "-o") out.outFile = argv[++i];
  }
  return out;
}

function usage() {
  console.log(`
Random CLI Tool

Options:
  --file, -f   Input file path (required)
  --mode, -m   stats | watch | transform   (default: stats)
  --out, -o    Output file path (required for transform)
  --help, -h   Show help

Examples:
  node random-cli-tool.js -f notes.txt -m stats
  node random-cli-tool.js -f notes.txt -m watch
  node random-cli-tool.js -f notes.txt -m transform -o out.txt
`.trim());
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function computeStats(text) {
  const lines = text.split(/\r?\n/);
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);

  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w, c]) => ({ word: w, count: c }));

  return {
    bytes: Buffer.byteLength(text, "utf8"),
    lines: lines.length,
    words: words.length,
    uniqueWords: freq.size,
    sha256: hashText(text),
    top10: top,
  };
}

function transform(text) {
  // Fun transform: trim trailing spaces, collapse blank lines, add line numbers.
  const cleaned = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  const numbered = cleaned
    .split("\n")
    .map((l, idx) => String(idx + 1).padStart(4, "0") + " | " + l)
    .join("\n");

  return numbered + "\n";
}

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((r) => rl.question(question, r));
  rl.close();
  return answer.trim().toLowerCase().startsWith("y");
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.file) {
    usage();
    process.exit(args.file ? 0 : 1);
  }

  const filePath = path.resolve(args.file);

  const read = () => fs.promises.readFile(filePath, "utf8");

  if (args.mode === "stats") {
    const text = await read();
    const s = computeStats(text);
    console.log(JSON.stringify(s, null, 2));
    return;
  }

  if (args.mode === "watch") {
    let lastHash = null;

    const tick = async () => {
      try {
        const text = await read();
        const h = hashText(text);
        if (h !== lastHash) {
          lastHash = h;
          const s = computeStats(text);
          console.clear();
          console.log(`Watching: ${filePath}`);
          console.log(`Updated: ${new Date().toLocaleString()}`);
          console.log(`SHA256:  ${s.sha256}`);
          console.log(`Lines:   ${s.lines}  Words: ${s.words}  Unique: ${s.uniqueWords}`);
          console.log("\nTop words:");
          for (const t of s.top10) console.log(`  ${t.word.padEnd(14)} ${t.count}`);
        }
      } catch (e) {
        console.error("Watch error:", e.message);
      }
    };

    console.log(`Watching ${filePath} (Ctrl+C to stop)`);
    await tick();
    const timer = setInterval(tick, 800);

    // Clean exit
    process.on("SIGINT", () => {
      clearInterval(timer);
      console.log("\nBye!");
      process.exit(0);
    });
    return;
  }

  if (args.mode === "transform") {
    if (!args.outFile) {
      console.error("Missing --out for transform mode.");
      usage();
      process.exit(1);
    }

    const outPath = path.resolve(args.outFile);
    const text = await read();
    const out = transform(text);

    if (fs.existsSync(outPath)) {
      const ok = await confirm(`"${outPath}" exists. Overwrite? (y/N) `);
      if (!ok) {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    await fs.promises.writeFile(outPath, out, "utf8");
    console.log(`Wrote transformed output to: ${outPath}`);
    return;
  }

  console.error(`Unknown mode: ${args.mode}`);
  usage();
  process.exit(1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
