# 第一課口語遊戲套件 QA

日期：2026-08-23

## 靜態檢查

- `node --check app.js`：通過。
- `node --check content/registry.js`：通過。
- `node --check content/lesson-01.js`：通過。
- `node qa/validate-content.mjs`：通過。
- 內容：2 個課程階段包、16 個模式實例；所有 `sourceRefs` 都存在於 canonical source 且符合階段允許範圍。
- 早期包未出現後半課的「不然」「是……還是……」「怎麼……怎麼……」、諧音、單姓、復姓、尊稱或《百家姓》內容。

## 瀏覽器 smoke

- Chromium 1366×768：八種模式、兩個階段包、侦探答案 reveal/hide，通過。
- WebKit 1024×768：八種模式，通過。
- Chromium 390×844：八種模式，通過。
- 鍵盤完成流程：`N` 在快速回憶、排名並辯護、任務解決中可完成目前題目，通過。
- 以上 viewport：無水平溢位、無 console error、無 warning、無外部請求。
- 代表畫面：
  - `classroom-tools/lesson-01-game-suite/qa/screenshots/chrome-1366-home.png`
  - `classroom-tools/lesson-01-game-suite/qa/screenshots/chrome-1366-random-speaking.png`
  - `classroom-tools/lesson-01-game-suite/qa/screenshots/chrome-1366-team-board.png`
  - `classroom-tools/lesson-01-game-suite/qa/screenshots/chrome-390-home.png`

## 尚未驗證

- 尚未完成榮市大學真實班級的教師 rehearsal。
- 尚未把這套 classroom tool 登記進 `lessons/lesson-01/20-approved/`；目前保持獨立，避免改動第一課已確認教材包。
