# 心晴練習室 Expo app

同一套 React Native 程式支援 Expo Go 和 HTTPS 網頁部署。介面包含願景練習、逐項五感想像、成功日記、週／月／全部成就總結、密碼鎖、JSON 匯入匯出及刪除所有資料。桌面網頁版使用左側導覽，手機版使用底部導覽。

願景、五感資料和成功日記儲存在本機；原生端使用 Expo SQLite KV store，網頁端使用瀏覽器 localStorage。密碼在原生端由 SecureStore 保護，在網頁端以 SHA-256 雜湊後儲存在瀏覽器。兩端不會自動雲端同步。

## 啟動 Expo Go

1. 安裝 Node.js 24 或更新版本及手機上的 Expo Go（SDK 57 相容版）。
2. 在本資料夾執行 `npm install`。
3. 執行 `npx expo start`，手機和電腦連接同一網絡後掃描終端機 QR code。

## 啟動網頁預覽

執行 `npm run web`，本機開啟 Expo Web 預覽。

## 輸出 HTTPS 網頁

執行 `npm run build:web`，Metro 會將靜態網站輸出到 `dist/`。把 `dist/` 部署至支援 HTTPS 的靜態網站主機（例如 GitHub Pages、Netlify 或 Cloudflare Pages）即可使用 HTTPS 網址。部署服務和網域需由網站擁有人提供。

網頁端資料保存在該瀏覽器的 localStorage；手機端資料留在該裝置。兩端不會自動雲端同步。
