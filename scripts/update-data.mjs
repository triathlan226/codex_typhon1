import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataPath = resolve(root, "data", "storm-data.json");

const urls = {
  cwaKml: "https://app.cwa.gov.tw/Data/typhoon/PTA_KMZ/fifows_typhoon.kml",
  jmaTargets: "https://www.jma.go.jp/bosai/typhoon/data/targetTc.json",
  jtwc: "https://www.metoc.navy.mil/jtwc/products/wp0926web.txt"
};

const fallbackColors = {
  cwa: "#ec5d3f",
  jma: "#168f7f",
  jtwc: "#2f70d7"
};

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

async function readExistingData() {
  try {
    return JSON.parse(await readFile(dataPath, "utf8"));
  } catch {
    return null;
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function taipeiLabelToUtc(label) {
  const match = label.match(/(\d{2})月(\d{2})日(\d{2})時/u);
  if (!match) return null;
  const [, month, day, hour] = match;
  const utcMs = Date.UTC(2026, Number(month) - 1, Number(day), Number(hour) - 8);
  return new Date(utcMs).toISOString();
}

function formatTaipeiLabel(label) {
  const match = label.match(/(\d{2})月(\d{2})日(\d{2})時/u);
  if (!match) return label;
  return `${match[1]}/${match[2]} ${match[3]}:00`;
}

function formatJstLabel(isoTime) {
  const date = new Date(isoTime);
  const jstMs = date.getTime() + 9 * 60 * 60 * 1000;
  const jst = new Date(jstMs);
  return `${pad(jst.getUTCMonth() + 1)}/${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:00 JST`;
}

function parseCwa(kml, existing) {
  const currentDescription = kml.match(/<Folder><name>颱風消息<\/name><description>([^<]+)<\/description>/u)?.[1] || "";
  const currentDetail = kml.match(/<name>巴威 - [^<]+<\/name>\s*<description>\s*([\s\S]*?)\s*<\/description>/u)?.[1] || "";
  const currentWindMs = Number(currentDetail.match(/最大風速每秒\s*(\d+)/u)?.[1] || 0) || undefined;
  const pressure = Number(currentDetail.match(/中心氣壓\s*(\d+)/u)?.[1] || 0) || undefined;
  const radiusKm = Number(currentDetail.match(/七級風半徑\s*(\d+)/u)?.[1] || 0) || undefined;
  const section = kml.match(/<Folder>\s*<name>預測颱風位置<\/name>([\s\S]*?)<\/Folder>/u)?.[1] || "";
  const forecastRegex = /<Placemark>\s*<name>([^<]+)<\/name>[\s\S]*?<coordinates>([-\d.]+),([-\d.]+),0<\/coordinates>/gu;
  const existingByLabel = new Map((existing?.agencies?.cwa?.points || []).map((point) => [point.label, point]));
  const points = [...section.matchAll(forecastRegex)].map((match) => {
    const label = formatTaipeiLabel(match[1]);
    const previous = existingByLabel.get(label) || {};
    return {
      time: taipeiLabelToUtc(match[1]),
      label,
      lat: Number(match[3]),
      lon: Number(match[2]),
      windMs: previous.windMs || currentWindMs,
      pressure: previous.pressure || pressure,
      radiusKm: previous.radiusKm || radiusKm,
      probabilityKm: previous.probabilityKm
    };
  }).filter((point) => point.time && Number.isFinite(point.lat) && Number.isFinite(point.lon));

  return {
    label: "台灣 CWA",
    shortLabel: "CWA",
    color: fallbackColors.cwa,
    source: "中央氣象署颱風消息 / KML",
    note: `${currentDescription.replace("T", " ").replace("+08:00", " TST")} 分析，${points[0]?.label || ""} 起預測`,
    points
  };
}

async function parseJma() {
  const targets = await fetchJson(urls.jmaTargets);
  const target = targets.find((item) => item.typhoonNumber === "2609") || targets[0];
  if (!target) throw new Error("JMA targetTc.json has no active typhoon");
  const forecast = await fetchJson(`https://www.jma.go.jp/bosai/typhoon/data/${target.tropicalCyclone}/forecast.json`);
  const items = Array.isArray(forecast) ? forecast : forecast.forecasts || [];
  const points = items
    .filter((item) => item?.validtime?.UTC && item?.center && item?.advancedHours !== 0)
    .map((item) => ({
      time: new Date(item.validtime.UTC).toISOString(),
      label: formatJstLabel(item.validtime.UTC),
      lat: Number(item.center[0]),
      lon: Number(item.center[1]),
      probabilityKm: item.probabilityCircle?.radius ? Number((item.probabilityCircle.radius / 1000).toFixed(1)) : undefined
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));

  return {
    label: "日本 JMA",
    shortLabel: "JMA",
    color: fallbackColors.jma,
    source: "日本氣象廳 typhoon JSON",
    note: `${target.issue.replace("T", " ")} 發布`,
    points
  };
}

function parseJtwc(text) {
  const warning = text.match(/WARNING NR\s+(\d+)/)?.[1] || "";
  const header = text.match(/^(WTPN31 PGTW \d{6})/m)?.[1] || "";
  const forecastRegex = /(\d{2,3})\s+HRS,\s+VALID AT:\s*\n\s*(\d{6}Z)\s+---\s+([0-9.]+)([NS])\s+([0-9.]+)([EW])[\s\S]*?MAX SUSTAINED WINDS -\s+(\d+)\s+KT/g;
  const points = [...text.matchAll(forecastRegex)].map((match) => {
    const day = Number(match[2].slice(0, 2));
    const hour = Number(match[2].slice(2, 4));
    const minute = Number(match[2].slice(4, 6));
    const lat = Number(match[3]) * (match[4] === "S" ? -1 : 1);
    const lon = Number(match[5]) * (match[6] === "W" ? -1 : 1);
    return {
      time: new Date(Date.UTC(2026, 6, day, hour, minute)).toISOString(),
      label: match[2],
      lat,
      lon,
      windKt: Number(match[7])
    };
  });

  return {
    label: "美軍 JTWC",
    shortLabel: "JTWC",
    color: fallbackColors.jtwc,
    source: warning ? `JTWC Warning ${warning}` : "JTWC Warning",
    note: header || "JTWC tropical cyclone warning",
    points
  };
}

function buildData({ cwa, jma, jtwc }) {
  const issueLabel = `更新：${cwa.note.split(" 分析")[0] || "最新資料"}`;
  return {
    name: "颱風巴威 BAVI",
    issueLabel,
    startLabel: `${cwa.points[0]?.label || "最新"} 起`,
    summary:
      "資料由 GitHub Action 抓取 CWA、JMA、JTWC 公開來源後整理。動畫可選各單位個別路徑，不使用中間值；Windy 區塊同步到目前動畫點，作為 ECMWF 風場視覺參考。",
    agencies: { cwa, jma, jtwc }
  };
}

async function main() {
  const existing = await readExistingData();
  const [cwaKml, jtwcText] = await Promise.all([fetchText(urls.cwaKml), fetchText(urls.jtwc)]);
  const [cwa, jma, jtwc] = await Promise.all([parseCwa(cwaKml, existing), parseJma(), Promise.resolve(parseJtwc(jtwcText))]);
  const data = buildData({ cwa, jma, jtwc });
  await mkdir(dirname(dataPath), { recursive: true });
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Updated ${dataPath}`);
  console.log(data.issueLabel);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
