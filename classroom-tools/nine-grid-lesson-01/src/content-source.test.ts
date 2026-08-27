import { describe, expect, it, vi } from "vitest";
import { loadCommittedSeed, resolveContentSource } from "./content-source";
import type { ContentPack } from "./types";

const validPack: ContentPack = {
  schema_version: "1.0.0",
  pack_id: "pack-a",
  class_id: "class-a",
  class_name: "Lớp A",
  content_revision: 1,
  chinese_variant: "simplified",
  lessons: [{ lesson_id: "l1", lesson_name: "Bài 1", order: 1 }],
  characters: [{ item_id: "c1", character: "你", introduced_lesson_id: "l1" }],
  vocabulary: [], grammar: [], sentences: [], exercises: []
};

describe("committed content seed", () => {
  it("loads embedded content without fetching for the offline file", async () => {
    const globalWithContent = globalThis as typeof globalThis & { __CLASS_CONTENT__?: unknown };
    globalWithContent.__CLASS_CONTENT__ = validPack;
    const fetchSeed = vi.fn();
    try {
      const result = await loadCommittedSeed(fetchSeed as never, "file:///tmp/game.html");
      expect(result.pack).toMatchObject({ pack_id: "pack-a", class_id: "class-a" });
      expect(result.error).toBe("");
      expect(fetchSeed).not.toHaveBeenCalled();
    } finally {
      delete globalWithContent.__CLASS_CONTENT__;
    }
  });

  it("fetches relative to the document base and validates canonical JSON", async () => {
    const fetchSeed = vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify(validPack) }));
    const baseUrl = ["https:", "", "example.test", "class-a", "game", ""].join("/");
    const result = await loadCommittedSeed(fetchSeed, baseUrl);
    expect(fetchSeed).toHaveBeenCalledWith(new URL("content/class-content.json", baseUrl).toString());
    expect(result.error).toBe("");
    expect(result.pack).toMatchObject({
      pack_id: "pack-a",
      class_id: "class-a",
      characters: [{ item_id: "c1", character: "你", introduced_lesson_id: "l1" }]
    });
  });

  it("treats a missing seed as an intentional empty state", async () => {
    const result = await loadCommittedSeed(
      async () => ({ ok: false, status: 404, text: async () => "" }),
      ["https:", "", "example.test", "game", ""].join("/")
    );
    expect(result).toEqual({ pack: null, error: "" });
  });

  it("reports invalid seed content in Chinese without returning a pack", async () => {
    const result = await loadCommittedSeed(
      async () => ({ ok: true, status: 200, text: async () => "{invalid" }),
      ["https:", "", "example.test", "game", ""].join("/")
    );
    expect(result.pack).toBeNull();
    expect(result.error).toContain("内容无效");
    expect(result.error).toContain("JSON");
  });

  it("lets the browser override win without requesting the seed", async () => {
    const loadSeed = vi.fn(async () => ({ pack: validPack, error: "" }));
    const override = { ...validPack, pack_id: "browser-pack" };
    const result = await resolveContentSource(async () => override, loadSeed);
    expect(result).toEqual({ pack: override, source: "browser", error: "" });
    expect(loadSeed).not.toHaveBeenCalled();
  });

  it("falls back to the committed seed when the browser override is absent", async () => {
    const result = await resolveContentSource(
      async () => null,
      async () => ({ pack: validPack, error: "" })
    );
    expect(result).toEqual({ pack: validPack, source: "project", error: "" });
  });
});
