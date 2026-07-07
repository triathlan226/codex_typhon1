# 颱風巴威預測路徑動畫

這是一個可直接上 GitHub Pages 的靜態網頁，用 Leaflet 地圖顯示颱風巴威的公開預測路徑動畫。

## 目前版本

- 只顯示 2026/07/07 中午以後的預測資料。
- 不顯示中午前資料，也不顯示過去路徑。
- 可以選擇動畫依據：台灣 CWA、日本 JMA、美國 JTWC。
- 選哪一個機構，颱風動畫就沿著該機構的預測中心線移動，不取三家平均或中間值。
- 手機優先版面，底部控制面板適合直式手機觀看。

## 檔案

- `index.html`：主頁面
- `styles.css`：手機與桌面版面
- `app.js`：CWA、JMA、JTWC 預測座標與動畫邏輯

## 資料來源與時間

- 中央氣象署 CWA：2026-07-07 08:00 TST 颱風消息與 KML 路徑，頁面從 14:00 預測點開始呈現。
- 日本氣象廳 JMA：2026-07-07 12:45 JST 發布之颱風資料，頁面保留預測點。
- JTWC：Typhoon 09W BAVI Warning NR 025，2026-07-07 0300Z，頁面保留預測點。

這個頁面是公開資料視覺化，不是官方警報系統。防颱決策請以中央氣象署最新警特報為準。

## 本機預覽

```powershell
python -m http.server 8000
```

然後打開 `http://localhost:8000`。

## GitHub Pages

如果 repository 已經上傳到 GitHub：

1. 到 repository 的 `Settings` -> `Pages`。
2. `Source` 選 `Deploy from a branch`。
3. branch 選 `main`，資料夾選 `/root`。
4. 儲存後等 1-2 分鐘，就會得到分享網址。
