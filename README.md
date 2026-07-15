# 颱風巴威預測路徑動畫

這是一個部署到 GitHub Pages 的靜態網頁，用 Leaflet 顯示颱風巴威 BAVI 的預測路徑動畫。

## 目前狀態

颱風巴威已過境，本頁已改為封存展示版，不再自動抓取 CWA、JMA、JTWC 的最新資料，也沒有 GitHub Actions 定時更新。

## 功能

- 從 2026/07/08 之後的預測點開始顯示，前段歷史路徑不進動畫。
- 可切換 CWA、JMA、JTWC，動畫會照選定單位的路徑跑，不取中間值。
- 手機優先版面，控制面板固定在畫面下方。
- 內嵌 Windy ECMWF surface wind 視覺參考，並可同步到目前動畫點。
- `data/storm-data.json` 保留最後整理的封存資料。

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

本頁僅為公開資料視覺化封存，不是官方警報。防災資訊請以中央氣象署與地方政府正式公告為準。
