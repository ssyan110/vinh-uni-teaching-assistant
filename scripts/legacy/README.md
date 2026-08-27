# Legacy scripts

這裡保留已退出目前生產流程的重建器、一次性遷移工具、舊 PDF renderer、舊
fontconfig 與歷次文化補充 PPTX builder。它們只用於閱讀歷史流程或在明確需要
時重建 archive 證據，不得用來產生目前教材；若經明確授權執行，輸出只能放在
獨立的 `archive/legacy-rebuilds/`，不得寫入 authority 或 release。

目前教材只使用根目錄 `scripts/` 中的 active entry points；新 draft 必須寫入
`lessons/boya-intermediate-i/lesson-01/10-design/`，並先通過 `scripts/production_gate.py`。
