import { parseContent, validatePack } from "./importer";
import type { ContentPack } from "./types";

export type ContentSource = "browser" | "project" | null;

export interface ContentResolution {
  pack: ContentPack | null;
  source: ContentSource;
  error: string;
}

type FetchResponse = Pick<Response, "ok" | "status" | "text">;
type FetchSeed = (input: string) => Promise<FetchResponse>;

export async function loadCommittedSeed(
  fetchSeed: FetchSeed = (input) => fetch(input, { cache: "no-store" }),
  baseUrl = document.baseURI
): Promise<Omit<ContentResolution, "source">> {
  const embedded = (globalThis as typeof globalThis & { __CLASS_CONTENT__?: unknown }).__CLASS_CONTENT__;
  if (embedded) {
    try {
      const preview = parseContent(JSON.stringify(embedded), "class-content.json");
      const errors = validatePack(preview.pack);
      if (errors.length) throw new Error(errors.join(" "));
      return { pack: preview.pack, error: "" };
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : "无法检查内容。";
      return { pack: null, error: `内嵌课堂内容无效：${detail}` };
    }
  }
  const seedUrl = new URL("content/class-content.json", baseUrl).toString();
  let response: FetchResponse;
  try {
    response = await fetchSeed(seedUrl);
  } catch {
    return {
      pack: null,
      error: "无法读取项目内容，请检查 public/content/class-content.json。"
    };
  }

  if (response.status === 404) return { pack: null, error: "" };
  if (!response.ok) {
    return {
      pack: null,
      error: `无法读取项目内容（HTTP ${response.status}）。`
    };
  }

  try {
    const preview = parseContent(await response.text(), "class-content.json");
    const errors = validatePack(preview.pack);
    if (errors.length) throw new Error(errors.join(" "));
    return { pack: preview.pack, error: "" };
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : "无法检查内容。";
    return {
      pack: null,
      error: `public/content/class-content.json 内容无效：${detail}`
    };
  }
}

export async function resolveContentSource(
  loadBrowserOverride: () => Promise<ContentPack | null>,
  loadSeed: () => Promise<Omit<ContentResolution, "source">> = loadCommittedSeed
): Promise<ContentResolution> {
  const browserPack = await loadBrowserOverride();
  if (browserPack) return { pack: browserPack, source: "browser", error: "" };
  const seed = await loadSeed();
  return { ...seed, source: seed.pack ? "project" : null };
}
