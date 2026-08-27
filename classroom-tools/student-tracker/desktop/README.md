# macOS App

在專案目錄執行：

```bash
npm install
npm run desktop:package
npm run desktop:install
```

完成後可在 Finder 的「應用程式」中開啟「課跡」。打包器會把 Vite 產生的前端與本機 HTTP server 一起放入 App，因此瀏覽器路由與 Supabase 連線都能維持原本的行為。

第一次開啟若看到 macOS 未簽署提示，請在「應用程式」中對「課跡」按住 Control 點擊，選擇「打開」。目前版本尚未進行 Apple Developer ID 簽署與 notarization。
