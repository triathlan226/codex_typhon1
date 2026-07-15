const fallbackStormData = {
  name: "颱風巴威 BAVI",
  issueLabel: "封存：2026/07/12 20:00 TST",
  startLabel: "07/13 02:00 起封存",
  summary:
    "颱風巴威已過境，本頁保留最後整理的公開預測路徑作為封存動畫。動畫可選 CWA、JMA 或 JTWC 的個別路徑，不使用中間值；Windy 區塊仍可同步到目前動畫點作為風場畫面參考。",
  agencies: {
    cwa: {
      label: "台灣 CWA",
      shortLabel: "CWA",
      color: "#ec5d3f",
      source: "中央氣象署颱風消息 / KML",
      note: "2026/07/12 20:00 TST 分析，07/13 02:00 起預測",
      points: [
        { time: "2026-07-12T18:00:00.000Z", label: "07/13 02:00", lat: 32.7, lon: 117.6, windMs: 28, pressure: 980, radiusKm: 220 },
        { time: "2026-07-13T00:00:00.000Z", label: "07/13 08:00", lat: 33.4, lon: 117.6, windMs: 28, pressure: 980, radiusKm: 220 },
        { time: "2026-07-13T06:00:00.000Z", label: "07/13 14:00", lat: 33.9, lon: 117.8, windMs: 23, pressure: 985, radiusKm: 150 },
        { time: "2026-07-13T12:00:00.000Z", label: "07/13 20:00", lat: 34.6, lon: 118.3, windMs: 23, pressure: 985, radiusKm: 150 },
        { time: "2026-07-14T00:00:00.000Z", label: "07/14 08:00", lat: 36.5, lon: 120.4, windMs: 23, pressure: 985, radiusKm: 150 },
        { time: "2026-07-14T12:00:00.000Z", label: "07/14 20:00", lat: 38.6, lon: 124.2, windMs: 23, pressure: 985, radiusKm: 150 }
      ]
    },
    jma: {
      label: "日本 JMA",
      shortLabel: "JMA",
      color: "#168f7f",
      source: "日本氣象廳 typhoon JSON",
      note: "2026/07/13 03:50 JST 發布",
      points: [
        { time: "2026-07-13T06:00:00.000Z", label: "07/13 15:00 JST", lat: 33.9, lon: 118.0, probabilityKm: 46.3 },
        { time: "2026-07-13T18:00:00.000Z", label: "07/14 03:00 JST", lat: 35.4, lon: 119.5, probabilityKm: 77.8 },
        { time: "2026-07-14T18:00:00.000Z", label: "07/15 03:00 JST", lat: 39.4, lon: 128.5, probabilityKm: 185.2 },
        { time: "2026-07-15T18:00:00.000Z", label: "07/16 03:00 JST", lat: 45.4, lon: 139.8, probabilityKm: 296.3 }
      ]
    },
    jtwc: {
      label: "美軍 JTWC",
      shortLabel: "JTWC",
      color: "#2f70d7",
      source: "JTWC Warning 044",
      note: "WTPN31 PGTW 112100",
      points: [
        { time: "2026-07-12T06:00:00.000Z", label: "120600Z", lat: 30.7, lon: 118.5, windKt: 40 },
        { time: "2026-07-12T18:00:00.000Z", label: "121800Z", lat: 32.3, lon: 117.7, windKt: 30 },
        { time: "2026-07-13T06:00:00.000Z", label: "130600Z", lat: 33.6, lon: 117.9, windKt: 25 },
        { time: "2026-07-13T18:00:00.000Z", label: "131800Z", lat: 35.1, lon: 119.1, windKt: 20 }
      ]
    }
  }
};

const taiwanCities = [
  ["台北", 25.0375, 121.5645],
  ["花蓮", 23.9872, 121.6015],
  ["台東", 22.7583, 121.1444],
  ["高雄", 22.6273, 120.3014],
  ["澎湖", 23.5711, 119.5793]
];

let stormData = structuredClone(fallbackStormData);
let activeIndex = 0;
let activeAgencyKey = "cwa";
let playerTimer = null;
let activeMarker = null;
let activeCircle = null;

const map = L.map("map", {
  zoomControl: false,
  preferCanvas: true
}).setView([22.8, 129.3], 5);

L.control.zoom({ position: "bottomleft" }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 10,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const slider = document.getElementById("timeSlider");
const speedSelect = document.getElementById("speedSelect");
const trackSelect = document.getElementById("trackSelect");
const playButton = document.getElementById("playButton");
const resetButton = document.getElementById("resetButton");
const frameTime = document.getElementById("frameTime");
const frameLatLng = document.getElementById("frameLatLng");
const statusCard = document.getElementById("statusCard");
const windyFrame = document.getElementById("windyFrame");
const windyOpenLink = document.getElementById("windyOpenLink");
const windyPoint = document.getElementById("windyPoint");

const layerGroups = {};
const activeLayer = L.layerGroup().addTo(map);
let cityLayer = L.layerGroup().addTo(map);

function currentAgency() {
  return stormData.agencies[activeAgencyKey];
}

function latLngs(points) {
  return points.map((point) => [point.lat, point.lon]);
}

function kmToMeters(km) {
  return Math.max(0, km || 0) * 1000;
}

function pointForIndex(points, index) {
  return points[Math.min(index, points.length - 1)];
}

function formatPoint(point) {
  return `${point.lat.toFixed(1)}N, ${point.lon.toFixed(1)}E`;
}

function setStatus(text) {
  statusCard.querySelector("span:last-child").textContent = text;
}

function createLabel(point, color) {
  return L.divIcon({
    className: "",
    html: `<div class="forecast-label" style="border-color:${color}33">${point.label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [-6, -6]
  });
}

function makeTyphoonIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div class="typhoon-marker" style="background:${color}">颱</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

function clearBaseLayers() {
  Object.values(layerGroups).forEach((group) => group.removeFrom(map));
  Object.keys(layerGroups).forEach((key) => delete layerGroups[key]);
  cityLayer.removeFrom(map);
  cityLayer = L.layerGroup().addTo(map);
  activeLayer.clearLayers();
  activeMarker = null;
  activeCircle = null;
}

function drawBaseLayers() {
  clearBaseLayers();

  taiwanCities.forEach(([name, lat, lon]) => {
    L.circleMarker([lat, lon], {
      radius: 4,
      color: "#10283c",
      fillColor: "#ffffff",
      fillOpacity: 0.92,
      weight: 1.5
    }).addTo(cityLayer).bindTooltip(name, { direction: "top" });
  });

  Object.entries(stormData.agencies).forEach(([key, agency]) => {
    const group = L.layerGroup();
    layerGroups[key] = group;

    L.polyline(latLngs(agency.points), {
      color: agency.color,
      weight: key === "cwa" ? 5 : 3,
      opacity: key === "cwa" ? 0.96 : 0.82,
      dashArray: key === "cwa" ? null : "6 8"
    }).addTo(group).bindTooltip(`${agency.label} ${agency.note}`, { sticky: true });

    agency.points.forEach((point, index) => {
      L.circleMarker([point.lat, point.lon], {
        radius: index === 0 ? 5 : 4,
        color: agency.color,
        fillColor: "#ffffff",
        fillOpacity: 0.94,
        weight: 2
      }).addTo(group).bindPopup(`<b>${agency.label}</b><br>${point.label}<br>${formatPoint(point)}`);

      const shouldLabel =
        (key === "cwa" && [0, 2, 5, 6, 8].includes(index)) ||
        (key !== "cwa" && (index === 0 || index === agency.points.length - 1));

      if (shouldLabel) {
        L.marker([point.lat, point.lon], { icon: createLabel(point, agency.color), interactive: false }).addTo(group);
      }

      if (point.probabilityKm > 0 && (key === "cwa" || key === "jma")) {
        L.circle([point.lat, point.lon], {
          radius: kmToMeters(point.probabilityKm),
          color: agency.color,
          fillColor: agency.color,
          fillOpacity: key === "cwa" ? 0.055 : 0.035,
          opacity: 0.2,
          weight: 1
        }).addTo(group);
      }
    });

    const checkbox = document.querySelector(`[data-agency="${key}"]`);
    if (!checkbox || checkbox.checked) {
      group.addTo(map);
    }
  });
}

function updateSliderBounds() {
  slider.max = currentAgency().points.length - 1;
  if (activeIndex > Number(slider.max)) activeIndex = Number(slider.max);
  slider.value = activeIndex;
}

function drawActiveMarker(point, agency) {
  if (!activeMarker) {
    activeMarker = L.marker([point.lat, point.lon], {
      icon: makeTyphoonIcon(agency.color),
      zIndexOffset: 1100
    }).addTo(activeLayer);
  }

  if (!activeCircle) {
    activeCircle = L.circle([point.lat, point.lon], {
      radius: 0,
      color: agency.color,
      fillColor: agency.color,
      fillOpacity: 0.07,
      opacity: 0.28,
      weight: 2
    }).addTo(activeLayer);
  }

  activeMarker.setIcon(makeTyphoonIcon(agency.color));
  activeMarker.setLatLng([point.lat, point.lon]);
  activeCircle.setStyle({
    color: agency.color,
    fillColor: agency.color,
    opacity: agency.shortLabel === "CWA" ? 0.28 : 0.16,
    fillOpacity: agency.shortLabel === "CWA" ? 0.07 : 0.035
  });
  activeCircle.setLatLng([point.lat, point.lon]);
  activeCircle.setRadius(kmToMeters(point.radiusKm || point.probabilityKm || 0));
}

function utcTimeSlug(point) {
  const date = new Date(point.time);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}-${pad(date.getUTCHours())}`;
}

function buildWindyOpenUrl(point) {
  return `https://www.windy.com/?${utcTimeSlug(point)},${point.lat.toFixed(3)},${point.lon.toFixed(3)},6`;
}

function buildWindyEmbedUrl(point) {
  const params = new URLSearchParams({
    type: "map",
    location: "coordinates",
    metricRain: "mm",
    metricTemp: "°C",
    metricWind: "kt",
    zoom: "5",
    overlay: "wind",
    product: "ecmwf",
    level: "surface",
    lat: point.lat.toFixed(3),
    lon: point.lon.toFixed(3),
    detailLat: point.lat.toFixed(3),
    detailLon: point.lon.toFixed(3),
    detail: "true",
    message: "true"
  });
  return `https://embed.windy.com/embed.html?${params.toString()}`;
}

function updateWindyReference(point, agency, reloadFrame = false) {
  windyPoint.textContent = `${agency.shortLabel} ${point.label} · ${formatPoint(point)}`;
  windyOpenLink.href = buildWindyOpenUrl(point);

  if (reloadFrame) {
    windyFrame.src = buildWindyEmbedUrl(point);
  }
}

function updateFrame(index) {
  activeIndex = Number(index);
  updateSliderBounds();

  const agency = currentAgency();
  const point = pointForIndex(agency.points, activeIndex);
  drawActiveMarker(point, agency);

  frameTime.textContent = `${agency.shortLabel} ${point.label}`;
  frameLatLng.textContent = formatPoint(point);
  setStatus(`動畫路徑：${agency.label} · ${point.label} · ${formatPoint(point)}`);
  updateWindyReference(point, agency);
}

function setPlayButton(icon, label) {
  playButton.querySelectorAll("svg, i").forEach((node) => node.remove());
  playButton.querySelector("span").textContent = label;
  playButton.insertAdjacentHTML("afterbegin", `<i data-lucide="${icon}"></i>`);
  lucide.createIcons();
}

function stopPlayer() {
  if (playerTimer) {
    clearInterval(playerTimer);
    playerTimer = null;
  }
  setPlayButton("play", "播放");
}

function startPlayer() {
  stopPlayer();
  setPlayButton("pause", "暫停");
  playerTimer = setInterval(() => {
    const next = activeIndex >= Number(slider.max) ? 0 : activeIndex + 1;
    updateFrame(next);
  }, Number(speedSelect.value));
}

function buildDetails() {
  const cwaFirst = stormData.agencies.cwa.points[0];
  const cwaNearTaiwan = stormData.agencies.cwa.points.find((point) => point.lon <= 124.2) || stormData.agencies.cwa.points.at(-1);
  const jmaLast = stormData.agencies.jma.points.at(-1);
  const jtwcLast = stormData.agencies.jtwc.points.at(-1);
  const items = [
    [stormData.issueLabel.replace("更新：", ""), "目前資料時間"],
    [cwaFirst.label, "CWA 動畫起點"],
    [`${cwaFirst.windMs || "-"} m/s`, "CWA 近中心最大風速"],
    [cwaNearTaiwan.label, "CWA 接近台灣附近時間"],
    [formatPoint(cwaNearTaiwan), "CWA 接近台灣附近位置"],
    [formatPoint(jmaLast), "JMA 最後預測點"],
    [formatPoint(jtwcLast), "JTWC 最後預測點"],
    [stormData.agencies.jtwc.source, "封存來源版本"]
  ];

  document.getElementById("detailGrid").innerHTML = items
    .map(([value, label]) => `<div class="metric"><b>${value}</b><span>${label}</span></div>`)
    .join("");
}

function updateHeader() {
  document.getElementById("mainTime").textContent = stormData.startLabel;
  document.getElementById("mainSummary").textContent = stormData.summary;
}

function applyStormData(nextData) {
  stormData = nextData;
  if (!stormData.agencies[activeAgencyKey]) {
    activeAgencyKey = "cwa";
    trackSelect.value = activeAgencyKey;
  }
  activeIndex = 0;
  stopPlayer();
  updateHeader();
  drawBaseLayers();
  buildDetails();
  updateFrame(0);
  fitInitialMap();
}

function fitInitialMap() {
  const allPoints = Object.values(stormData.agencies).flatMap((agency) => latLngs(agency.points));
  const bounds = L.latLngBounds([...allPoints, [21.8, 120.0], [25.4, 122.0]]);

  if (window.matchMedia("(max-width: 860px)").matches) {
    map.fitBounds(bounds, {
      paddingTopLeft: [18, 86],
      paddingBottomRight: [18, 410]
    });
  } else {
    map.fitBounds(bounds, { padding: [28, 28] });
  }
}

function bindControls() {
  playButton.addEventListener("click", () => {
    if (playerTimer) stopPlayer();
    else startPlayer();
  });

  resetButton.addEventListener("click", () => {
    stopPlayer();
    updateFrame(0);
  });

  speedSelect.addEventListener("change", () => {
    if (playerTimer) startPlayer();
  });

  trackSelect.addEventListener("change", (event) => {
    stopPlayer();
    activeAgencyKey = event.target.value;
    activeIndex = 0;
    updateFrame(0);
  });

  slider.addEventListener("input", (event) => {
    stopPlayer();
    updateFrame(event.target.value);
  });

  document.querySelectorAll("[data-agency]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const key = event.target.dataset.agency;
      if (event.target.checked) {
        layerGroups[key]?.addTo(map);
      } else {
        layerGroups[key]?.removeFrom(map);
      }
    });
  });

  document.getElementById("locateTaiwan").addEventListener("click", () => {
    map.flyTo([23.8, 122.8], 6, { duration: 0.8 });
  });

  document.getElementById("syncWindyButton").addEventListener("click", () => {
    const agency = currentAgency();
    const point = pointForIndex(agency.points, activeIndex);
    updateWindyReference(point, agency, true);
  });
}

function init() {
  bindControls();
  applyStormData(fallbackStormData);

  const firstPoint = pointForIndex(currentAgency().points, activeIndex);
  updateWindyReference(firstPoint, currentAgency(), true);
  lucide.createIcons();
}

init();
