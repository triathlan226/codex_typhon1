const stormData = {
  name: "巴威 BAVI",
  issueLabel: "7/7 中午後預測",
  startLabel: "2026/07/07 中午以後",
  summary:
    "畫面只保留 2026/07/07 中午以後的預測路徑，不顯示中午前資料與過去路徑。動畫可選 CWA、JMA 或 JTWC，選哪個機構就沿著該機構的預測中心線移動。",
  agencies: {
    cwa: {
      label: "台灣 CWA",
      shortLabel: "CWA",
      color: "#f05d3b",
      source: "中央氣象署",
      note: "14:00 起",
      points: [
        { time: "2026-07-07T06:00:00Z", label: "07/07 14:00", lat: 16.4, lon: 138.3, windMs: 60, pressure: 895, radiusKm: 350, probabilityKm: 40 },
        { time: "2026-07-07T12:00:00Z", label: "07/07 20:00", lat: 16.7, lon: 136.8, windMs: 60, pressure: 895, radiusKm: 350, probabilityKm: 50 },
        { time: "2026-07-07T18:00:00Z", label: "07/08 02:00", lat: 16.9, lon: 135.3, windMs: 60, pressure: 895, radiusKm: 350, probabilityKm: 80 },
        { time: "2026-07-08T00:00:00Z", label: "07/08 08:00", lat: 17.0, lon: 134.0, windMs: 60, pressure: 895, radiusKm: 350, probabilityKm: 90 },
        { time: "2026-07-08T12:00:00Z", label: "07/08 20:00", lat: 17.5, lon: 131.7, windMs: 60, pressure: 895, radiusKm: 350, probabilityKm: 110 },
        { time: "2026-07-09T00:00:00Z", label: "07/09 08:00", lat: 18.4, lon: 129.7, windMs: 60, pressure: 895, radiusKm: 350, probabilityKm: 150 },
        { time: "2026-07-10T00:00:00Z", label: "07/10 08:00", lat: 21.3, lon: 126.3, windMs: 58, pressure: 900, radiusKm: 350, probabilityKm: 210 },
        { time: "2026-07-11T00:00:00Z", label: "07/11 08:00", lat: 25.4, lon: 122.6, windMs: 48, pressure: 930, radiusKm: 320, probabilityKm: 360 },
        { time: "2026-07-12T00:00:00Z", label: "07/12 08:00", lat: 30.0, lon: 118.5, windMs: 28, pressure: 980, radiusKm: 220, probabilityKm: 460 }
      ]
    },
    jma: {
      label: "日本 JMA",
      shortLabel: "JMA",
      color: "#1a9b82",
      source: "日本氣象廳",
      note: "預測點",
      points: [
        { time: "2026-07-07T15:00:00Z", label: "07/08 00:00 JST", lat: 16.6, lon: 136.1, probabilityKm: 46.3 },
        { time: "2026-07-08T03:00:00Z", label: "07/08 12:00 JST", lat: 17.0, lon: 133.7, probabilityKm: 64.8 },
        { time: "2026-07-09T00:00:00Z", label: "07/09 09:00 JST", lat: 18.4, lon: 130.1, probabilityKm: 101.9 },
        { time: "2026-07-10T00:00:00Z", label: "07/10 09:00 JST", lat: 21.3, lon: 126.5, probabilityKm: 148.2 },
        { time: "2026-07-11T00:00:00Z", label: "07/11 09:00 JST", lat: 25.4, lon: 122.5, probabilityKm: 185.2 },
        { time: "2026-07-12T00:00:00Z", label: "07/12 09:00 JST", lat: 29.8, lon: 117.8, probabilityKm: 222.2 }
      ]
    },
    jtwc: {
      label: "美國 JTWC",
      shortLabel: "JTWC",
      color: "#2d71d9",
      source: "JTWC Warning 025",
      note: "預測點",
      points: [
        { time: "2026-07-07T12:00:00Z", label: "071200Z", lat: 16.6, lon: 137.1, windKt: 130 },
        { time: "2026-07-08T00:00:00Z", label: "080000Z", lat: 17.0, lon: 134.3, windKt: 130 },
        { time: "2026-07-08T12:00:00Z", label: "081200Z", lat: 17.6, lon: 132.2, windKt: 125 },
        { time: "2026-07-09T00:00:00Z", label: "090000Z", lat: 18.6, lon: 130.2, windKt: 115 },
        { time: "2026-07-09T12:00:00Z", label: "091200Z", lat: 19.8, lon: 128.5, windKt: 110 },
        { time: "2026-07-10T00:00:00Z", label: "100000Z", lat: 21.4, lon: 126.9, windKt: 105 },
        { time: "2026-07-11T00:00:00Z", label: "110000Z", lat: 25.3, lon: 123.2, windKt: 90 },
        { time: "2026-07-12T00:00:00Z", label: "120000Z", lat: 29.4, lon: 119.0, windKt: 50 }
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

const map = L.map("map", {
  zoomControl: false,
  preferCanvas: true
}).setView([22.8, 129.3], 5);

L.control.zoom({ position: "bottomleft" }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 10,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const layerGroups = {};
const activeLayer = L.layerGroup().addTo(map);
const slider = document.getElementById("timeSlider");
const speedSelect = document.getElementById("speedSelect");
const trackSelect = document.getElementById("trackSelect");
const playButton = document.getElementById("playButton");
const resetButton = document.getElementById("resetButton");
const frameTime = document.getElementById("frameTime");
const frameLatLng = document.getElementById("frameLatLng");
const statusCard = document.getElementById("statusCard");
let activeIndex = 0;
let activeAgencyKey = "cwa";
let playerTimer = null;
let activeMarker = null;
let activeCircle = null;

document.getElementById("mainTime").textContent = stormData.startLabel;
document.getElementById("mainSummary").textContent = stormData.summary;

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
    html: `<div class="typhoon-marker" style="background:${color}">●</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

function drawBaseLayers() {
  taiwanCities.forEach(([name, lat, lon]) => {
    L.circleMarker([lat, lon], {
      radius: 4,
      color: "#10283c",
      fillColor: "#ffffff",
      fillOpacity: 0.92,
      weight: 1.5
    }).addTo(map).bindTooltip(name, { direction: "top" });
  });

  Object.entries(stormData.agencies).forEach(([key, agency]) => {
    const group = L.layerGroup().addTo(map);
    layerGroups[key] = group;

    L.polyline(latLngs(agency.points), {
      color: agency.color,
      weight: key === "cwa" ? 5 : 3,
      opacity: key === "cwa" ? 0.96 : 0.82,
      dashArray: key === "cwa" ? null : "6 8"
    }).addTo(group).bindTooltip(agency.label, { sticky: true });

    agency.points.forEach((point, index) => {
      L.circleMarker([point.lat, point.lon], {
        radius: index === 0 ? 5 : 4,
        color: agency.color,
        fillColor: "#ffffff",
        fillOpacity: 0.94,
        weight: 2
      }).addTo(group).bindPopup(`<b>${agency.label}</b><br>${point.label}<br>${formatPoint(point)}`);

      if ((key === "cwa" && [1, 3, 6, 7, 8].includes(index)) || (key !== "cwa" && index === agency.points.length - 1)) {
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

function updateFrame(index) {
  activeIndex = Number(index);
  updateSliderBounds();

  const agency = currentAgency();
  const point = pointForIndex(agency.points, activeIndex);
  drawActiveMarker(point, agency);

  frameTime.textContent = `${agency.shortLabel} ${point.label}`;
  frameLatLng.textContent = formatPoint(point);
  statusCard.querySelector("span:last-child").textContent =
    `動畫依據：${agency.label}，${point.label}，中心約 ${formatPoint(point)}`;
}

function stopPlayer() {
  if (playerTimer) {
    clearInterval(playerTimer);
    playerTimer = null;
  }
  playButton.querySelector("span").textContent = "播放";
  playButton.querySelector("svg")?.remove();
  playButton.insertAdjacentHTML("afterbegin", '<i data-lucide="play"></i>');
  lucide.createIcons();
}

function startPlayer() {
  stopPlayer();
  playButton.querySelector("span").textContent = "暫停";
  playButton.querySelector("svg")?.remove();
  playButton.insertAdjacentHTML("afterbegin", '<i data-lucide="pause"></i>');
  lucide.createIcons();
  playerTimer = setInterval(() => {
    const next = activeIndex >= Number(slider.max) ? 0 : activeIndex + 1;
    updateFrame(next);
  }, Number(speedSelect.value));
}

function buildDetails() {
  const cwaFirst = stormData.agencies.cwa.points[0];
  const cwaNearTaiwan = stormData.agencies.cwa.points[7];
  const jmaLast = stormData.agencies.jma.points.at(-1);
  const jtwcLast = stormData.agencies.jtwc.points.at(-1);
  const items = [
    [cwaFirst.label, "CWA 動畫起點"],
    ["60 m/s", "CWA 起點近中心最大風速"],
    [cwaNearTaiwan.label, "CWA 預測接近台灣東北方"],
    [formatPoint(cwaNearTaiwan), "CWA 96 小時附近位置"],
    [formatPoint(jmaLast), "JMA 最後預測位置"],
    [formatPoint(jtwcLast), "JTWC 最後預測位置"]
  ];

  document.getElementById("detailGrid").innerHTML = items
    .map(([value, label]) => `<div class="metric"><b>${value}</b><span>${label}</span></div>`)
    .join("");
}

function bindControls() {
  playButton.addEventListener("click", () => {
    if (playerTimer) {
      stopPlayer();
    } else {
      startPlayer();
    }
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
        layerGroups[key].addTo(map);
      } else {
        layerGroups[key].removeFrom(map);
      }
    });
  });

  document.getElementById("locateTaiwan").addEventListener("click", () => {
    map.flyTo([23.8, 122.8], 6, { duration: 0.8 });
  });
}

function fitInitialMap() {
  const bounds = L.latLngBounds([
    ...latLngs(stormData.agencies.cwa.points),
    ...latLngs(stormData.agencies.jma.points),
    ...latLngs(stormData.agencies.jtwc.points),
    [21.8, 120.0],
    [25.4, 122.0]
  ]);

  if (window.matchMedia("(max-width: 860px)").matches) {
    map.fitBounds(bounds, {
      paddingTopLeft: [18, 86],
      paddingBottomRight: [18, 390]
    });
  } else {
    map.fitBounds(bounds, { padding: [28, 28] });
  }
}

drawBaseLayers();
buildDetails();
bindControls();
updateFrame(0);
fitInitialMap();
lucide.createIcons();
