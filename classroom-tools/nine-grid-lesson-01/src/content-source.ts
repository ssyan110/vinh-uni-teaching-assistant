import { parseContent, validatePack } from "./importer";
import type { ContentPack, TextbookCatalog, TextbookCatalogEntry } from "./types";

export type ContentSource = "browser" | "project" | null;

export interface ContentResolution {
  pack: ContentPack | null;
  source: ContentSource;
  error: string;
}

type FetchResponse = Pick<Response, "ok" | "status" | "text">;
type FetchSeed = (input: string) => Promise<FetchResponse>;

export interface TextbookLibraryResolution {
  catalog: TextbookCatalog;
  packs: Record<string, ContentPack>;
  error: string;
}

function parsePackPayload(raw: unknown, fileName: string): ContentPack {
  const preview = parseContent(JSON.stringify(raw), fileName);
  const errors = validatePack(preview.pack);
  if (errors.length) throw new Error(errors.join(" "));
  return preview.pack;
}

function parseCatalog(raw: unknown): TextbookCatalog {
  if (!raw || typeof raw !== "object") throw new Error("教材目录不是有效对象。");
  const source = raw as Record<string, unknown>;
  if (source.schema_version !== "1.0.0" || !Array.isArray(source.textbooks)) {
    throw new Error("教材目录必须使用 schema_version 1.0.0，并包含 textbooks 数组。");
  }
  const textbooks = source.textbooks.flatMap((item): TextbookCatalogEntry[] => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    const textbookId = String(entry.textbook_id ?? "").trim();
    const title = String(entry.title ?? "").trim();
    const packFile = String(entry.pack_file ?? "").trim();
    if (!textbookId || !title || !packFile) return [];
    return [{
      textbook_id: textbookId,
      title,
      description: String(entry.description ?? "").trim(),
      pack_file: packFile,
      default_lesson_id: String(entry.default_lesson_id ?? "").trim() || undefined,
      active: entry.active !== false
    }];
  });
  if (!textbooks.length) throw new Error("教材目录没有可用教材。");
  return { schema_version: "1.0.0", textbooks };
}

export async function loadCommittedLibrary(
  fetchSeed: FetchSeed = (input) => fetch(input, { cache: "no-store" }),
  baseUrl = document.baseURI
): Promise<TextbookLibraryResolution> {
  const globalWithLibrary = globalThis as typeof globalThis & {
    __TEXTBOOK_CATALOG__?: unknown;
    __TEXTBOOK_PACKS__?: Record<string, unknown>;
  };
  if (globalWithLibrary.__TEXTBOOK_CATALOG__ && globalWithLibrary.__TEXTBOOK_PACKS__) {
    try {
      const catalog = parseCatalog(globalWithLibrary.__TEXTBOOK_CATALOG__);
      const packs = Object.fromEntries(catalog.textbooks.map((entry) => {
        const raw = globalWithLibrary.__TEXTBOOK_PACKS__?.[entry.textbook_id];
        return [entry.textbook_id, parsePackPayload(raw, entry.pack_file)];
      }));
      return { catalog, packs, error: "" };
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : "无法检查教材目录。";
      return { catalog: { schema_version: "1.0.0", textbooks: [] }, packs: {}, error: `内嵌教材内容无效：${detail}` };
    }
  }

  try {
    const catalogResponse = await fetchSeed(new URL("content/textbooks.json", baseUrl).toString());
    if (catalogResponse.status === 404) {
      const legacy = await loadCommittedSeed(fetchSeed, baseUrl);
      if (!legacy.pack) return { catalog: { schema_version: "1.0.0", textbooks: [] }, packs: {}, error: legacy.error };
      const textbookId = legacy.pack.textbook_id || legacy.pack.class_id;
      return {
        catalog: {
          schema_version: "1.0.0",
          textbooks: [{
            textbook_id: textbookId,
            title: legacy.pack.class_name,
            description: "",
            pack_file: "content/class-content.json",
            default_lesson_id: legacy.pack.lessons[0]?.lesson_id,
            active: true
          }]
        },
        packs: { [textbookId]: legacy.pack },
        error: ""
      };
    }
    if (!catalogResponse.ok) throw new Error(`教材目录 HTTP ${catalogResponse.status}。`);
    const catalog = parseCatalog(JSON.parse(await catalogResponse.text()));
    const entries = catalog.textbooks.filter((entry) => entry.active !== false);
    const loaded = await Promise.all(entries.map(async (entry) => {
      const response = await fetchSeed(new URL(entry.pack_file, baseUrl).toString());
      if (!response.ok) throw new Error(`${entry.title} 内容 HTTP ${response.status}。`);
      return [entry.textbook_id, parsePackPayload(JSON.parse(await response.text()), entry.pack_file)] as const;
    }));
    return { catalog, packs: Object.fromEntries(loaded), error: "" };
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : "无法读取教材内容。";
    return { catalog: { schema_version: "1.0.0", textbooks: [] }, packs: {}, error: `教材内容无法使用：${detail}` };
  }
}

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
