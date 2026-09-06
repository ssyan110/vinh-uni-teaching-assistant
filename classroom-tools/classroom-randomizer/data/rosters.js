(function exposeRosterCatalog(root) {
  "use strict";

  // Student names are loaded after teacher authentication from Supabase.
  // Keep only public class metadata in the browser bundle.
  root.RandomizerRosters = Object.freeze({
    version: "2026-09-05",
    classes: Object.freeze({
      LT_01: Object.freeze([]),
      LT_02: Object.freeze([]),
      LT_03: Object.freeze([])
    })
  });
}(typeof globalThis !== "undefined" ? globalThis : this));
