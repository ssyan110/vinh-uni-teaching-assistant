# 內容包結構

遊戲入口只載入本地 JavaScript 內容包，不使用 `fetch()` 載入 JSON，因此可以直接用 `file://` 開啟。

```js
{
  schemaVersion: 1,
  id: "lesson-01-early",
  lessonId: "lesson-01",
  title: "第一課：聽說（一）後",
  stage: "完成听说（一）口语句式后",
  status: "approved",
  allowedSourceRefs: ["E01-003", "G01-001"],
  modes: {
    randomSpeaking: { items: [] },
    situationChanged: { items: [] },
    openBox: { items: [] },
    teamBoard: { categories: [] },
    rankDefend: { items: [] },
    detective: { items: [] },
    mission: { items: [] },
    retrieval: { items: [] }
  }
}
```

每個口語題至少要有：

- 清楚的情境與任務結果；
- 至少兩個學生角色或明確的說話／聽者責任；
- 可選的語言提示，不把提示當成唯一答案；
- `sourceRefs`，且每個來源編號都必須出現在本包的 `allowedSourceRefs`；
- 若是開放題，使用教師手動判定的 evidence，不放 `correctIndex`。

早期包不得引用後半課的姓氏、稱呼、諧音、單姓／復姓或後三個句式。新增內容前先更新 source map，再執行內容 validator。
