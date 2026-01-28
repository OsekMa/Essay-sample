import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * Sync local desktop folder into Vite public dir so the frontend can fetch it.
 * Source (macOS): ~/Desktop/essay sample
 * Target: <repo>/public/essay-sample
 *
 * Also generates <target>/index.json to drive the UI.
 */

const repoRoot = path.resolve(process.cwd());
const sourceDir = path.join(os.homedir(), "Desktop", "essay sample");
const targetDir = path.join(repoRoot, "public", "essay-sample");

const ALLOWED_EXT = new Set([
  ".md",
  ".txt",
  ".pdf",
  ".doc",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureEmptyDir(dir) {
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map((e) => fs.rm(path.join(dir, e.name), { recursive: true, force: true })),
  );
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === ".DS_Store") continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(abs)));
    } else if (e.isFile()) {
      out.push(abs);
    }
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

async function main() {
  if (!(await pathExists(sourceDir))) {
    console.warn(
      `[sync-essay-sample] Source folder not found: ${sourceDir}\n` +
        `[sync-essay-sample] Skipping sync. Create the folder (or rename it) to enable local sample rendering.`,
    );
    return;
  }

  await ensureEmptyDir(targetDir);

  const files = await walk(sourceDir);
  const copied = [];

  for (const absSrc of files) {
    const rel = path.relative(sourceDir, absSrc);
    const ext = path.extname(absSrc).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;

    const absDst = path.join(targetDir, rel);
    await fs.mkdir(path.dirname(absDst), { recursive: true });
    await fs.copyFile(absSrc, absDst);

    const stat = await fs.stat(absSrc);
    copied.push({
      path: toPosix(rel),
      bytes: stat.size,
      ext,
      name: path.basename(rel),
    });
  }

  copied.sort((a, b) => a.path.localeCompare(b.path));

  await fs.writeFile(
    path.join(targetDir, "index.json"),
    JSON.stringify(
      {
        source: sourceDir,
        generatedAt: new Date().toISOString(),
        files: copied,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`[sync-essay-sample] Copied ${copied.length} files -> public/essay-sample/`);
}

main().catch((err) => {
  console.error("[sync-essay-sample] Failed:", err);
  process.exitCode = 1;
});
