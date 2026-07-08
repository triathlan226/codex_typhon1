# 颱風巴威預測路徑動畫

這是一個可部署到 GitHub Pages 的靜態網頁，用 Leaflet 顯示颱風巴威 BAVI 的預測路徑動畫。

## 功能

- 從 2026/07/08 之後的預測點開始顯示，前段歷史路徑不進動畫。
- 可切換 CWA、JMA、JTWC，動畫會照選定單位的路徑跑，不取中間值。
- 手機優先版面，控制面板固定在畫面下方。
- 內嵌 Windy ECMWF surface wind 視覺參考，並可同步到目前動畫點。
- `data/storm-data.json` 是頁面讀取的資料檔；`scripts/update-data.mjs` 可抓最新公開資料並重寫它。

## 更新資料

本機手動更新：

```powershell
node scripts/update-data.mjs
```

GitHub 自動更新：

- `.github/workflows/update-data.yml` 每 3 小時會抓一次公開資料。
- 也可以到 GitHub repository 的 `Actions` 頁面，選 `Update typhoon data`，按 `Run workflow` 手動更新。
- 網頁上的「更新資料」按鈕會重新讀取已發布的 `data/storm-data.json`。

注意：GitHub Pages 是純靜態網站，朋友手機上的按鈕不能直接替你的 repo 寫入新檔案；真正會改資料檔的是 GitHub Action。

## 本機預覽

```powershell
python -m http.server 8000
```

開啟 `http://localhost:8000`。

## 資料來源

- 中央氣象署 CWA 颱風消息與 KML
- 日本氣象廳 JMA typhoon JSON
- JTWC Tropical Cyclone Warnings
- Windy ECMWF 視覺圖層作為風場參考

本頁僅為公開資料視覺化，不是官方警報。防災決策請以中央氣象署與地方政府正式公告為準。
