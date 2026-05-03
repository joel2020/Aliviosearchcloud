/**
 * Tiny, dependency-free frontmatter parser for the blog.
 *
 * Supported syntax (intentionally narrow, since we own the content):
 *   ---
 *   key: value
 *   quoted: "string with: colons"
 *   tags: [a, b, "c d"]
 *   ---
 *
 * If you need YAML features beyond this (anchors, multiline blocks, nested
 * objects), add `gray-matter` and swap it in. For our 8 seeded articles
 * the simpler parser keeps us off another runtime dep.
 */

export type FrontmatterValue = string | string[];
export type Frontmatter = Record<string, FrontmatterValue>;

export type ParsedMarkdown = {
  readonly data: Frontmatter;
  readonly body: string;
};

const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function stripQuotes(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseArray(raw: string): string[] {
  const inner = raw.trim().slice(1, -1).trim();
  if (!inner) return [];
  // Split on commas not inside quotes.
  const out: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (const ch of inner) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ",") {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out.map(stripQuotes).filter((s) => s.length > 0);
}

export function parseMarkdown(source: string): ParsedMarkdown {
  const match = FRONTMATTER_BLOCK.exec(source);
  if (!match) {
    return { data: {}, body: source };
  }
  const block = match[1] ?? "";
  const body = source.slice(match[0].length);
  const data: Frontmatter = {};
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = parseArray(value);
    } else {
      data[key] = stripQuotes(value);
    }
  }
  return { data, body };
}
