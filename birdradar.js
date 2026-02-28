/**
 * @file        birdradar.js
 * @description Frontend javascript for the birds radar track website tool for AI Cup 2026
 * @author      Reindert Pelsma <reindertpelsma@teamepoch.net>
 * @copyright   Copyright (c) 2026 Team Epoch
 * @license     MIT
*/

const {
  DeckGL,
  PathLayer,
  TileLayer,
  MVTLayer,
  TerrainLayer,
  Tile3DLayer,
  BitmapLayer,
} = deck;
// The 3D tiles loader comes from the loaders global if using CDN

// --- CONSTANTS ---
const BIRD_GROUPS = [
  "Unknown",
  "Clutter",
  "Cormorants",
  "Pigeons",
  "Ducks",
  "Geese",
  "Gulls",
  "Birds of Prey",
  "Waders",
  "Songbirds",
];

const BIRD_SPECIES = [
  "Unknown",
  "Dunlin",
  "Black-headed Gull",
  "European Herring Gull",
  "Barn Swallow",
  "Common Starling",
  "Common Buzzard",
  "Common Gull",
  "Great Cormorant",
  "Common Linnet",
  "Eurasian Curlew",
  "Feral Pigeon",
  "Common Kestrel",
  "Western Jackdaw",
  "Eurasian Magpie",
  "Pigeon",
  "Western Marsh Harrier",
  "Car",
  "Common Wood Pigeon",
  "Gull",
  "Lesser Black-backed Gull",
  "European Golden Plover",
  "Train",
  "White Wagtail",
  "Northern Lapwing",
  "Arctic Tern",
  "Common Snipe",
  "Greylag Goose",
  "Carrion Crow",
  "Mallard",
  "Great Black-backed Gull",
  "Barnacle Goose",
  "Tundra Bean Goose",
  "Wader",
  "Duck",
  "Turbine",
  "Clutter",
  "Goose",
  "Common Gull and Black-headed Gull",
  "European Goldfinch",
  "Sanderling",
  "Homing Pigeon",
  "Pipit",
  "Meadow Pipit",
  "Songbird",
  "Common Chaffinch",
  "Stock Dove",
  "Northern Pintail",
  "Song Thrush",
  "Greater White-fronted Goose",
  "Fieldfare",
  "Peregrine Falcon",
  "Gadwall",
  "Grey Plover",
  "Eurasian Skylark",
  "Redwing",
  "Rock Pipit",
  "Eurasian Sparrowhawk",
  "Blue Tit",
  "Brambling",
  "Crow",
  "Eurasian Oystercatcher",
  "Common Shelduck",
  "Rain",
  "Common Redshank",
  "Egyptian Goose",
  "Large Gull",
  "Common Tern",
  "Sheep",
];

const RADAR_SIZES = ["Large bird", "Small bird", "Medium", "Large", "Flock"];

const XOR_KEY =
  "ACCEPT_THE_COMPETITION_TERMS_AT_https://www.kaggle.com/competitions/ai-cup-2026-performance/rules_TO_USE_THE_TEST_SET_DO_NOT_REVERSE_ENGINEER";

// Color mapping
const CATEGORY_COLORS = {
  Clutter: [128, 128, 128],
  Cormorants: [30, 144, 255],
  Pigeons: [138, 43, 226],
  Ducks: [50, 205, 50],
  Geese: [255, 140, 0],
  Gulls: [224, 255, 255],
  "Birds of Prey": [220, 20, 60],
  Waders: [255, 105, 180],
  Songbirds: [255, 215, 0],
  Unknown: [255, 255, 255],
  "Test Set": [80, 93, 111],
};

const TEMPLATES = {
  feature: `import numpy as np # Imports install automatically from pip3

def calculate(coords, times, meta):
    """
    This function calculates features for every track. 
    The returned dictionary keys become sortable columns in the Grid View.

    Inputs:
    - coords: (N, 4) numpy array -> [Longitude, Latitude, Altitude (m), Radar Cross Section (dB)]
    - times:  (N,) numpy array   -> Elapsed time in seconds since the track started
    - meta:   Dictionary containing all metadata columns from the CSV: track_id,timestamp_start_radar_utc,timestamp_end_radar_utc,radar_bird_size,airspeed,min_z,max_z,observation_id,primary_observation_id,observer_position,observer_comment,n_birds_observed,bird_group,bird_species and is_test
    """
    
    # --- 1. Accessing Raw Radar Data (coords & times) ---
    lon = coords[:, 0]
    lat = coords[:, 1]
    altitudes = coords[:, 2]
    rcs_values = coords[:, 3]
    duration = float(times[-1] - times[0]) if len(times) > 0 else 0

    # --- 2. Radar-derived Columns (Available in Train & Test) ---
    radar_size = meta.get("radar_bird_size")
    airspeed = meta.get("airspeed", 0)
    # min_z and max_z are pre-calculated by the MAX Avian Radar
    radar_min_z = meta.get("min_z", 0)
    radar_max_z = meta.get("max_z", 0)

    # --- 3. Observation-related Columns (Available in Train Only) ---
    # Note: These return "Unknown" or 0 when viewing the Test Set.
    bird_group = meta.get("bird_group")
    bird_species = meta.get("bird_species")
    n_birds = meta.get("n_birds_observed", 0)
    comment = meta.get("observer_comment", "")
    obs_id = meta.get("observation_id", 0)
    p_obs_id = meta.get("primary_observation_id", 0)

    # --- 4. Returning Features ---
    # Add any custom logic here (e.g., np.std(rcs_values) to find signal stability)
    return {
        "bird_group": bird_group,       # The broad category (Gulls, Ducks, etc.)
        "bird_species": bird_species,   # The specific species (Mallard, etc.)
        "n_birds": n_birds,             # Count of birds in the flock
        "airspeed": airspeed,           # Speed relative to air
        "duration": duration,           # Total time track was active
        "avg_rcs": float(np.mean(rcs_values)), # Average radar signature
        "height_fluctuation": float(np.max(altitudes) - np.min(altitudes)),
        "radar_size_cat": radar_size,   # Radar's internal size estimate
        "timestamp_start_radar_utc": meta.get("timestamp_start_radar_utc"),
        "timestamp_end_radar_utc": meta.get("timestamp_end_radar_utc"),
        "min_z": meta.get("min_z"),
        "max_z": meta.get("max_z")
    }
    
# The teamepochgithub.github.io/aicup-birds-radar-detection-tool/ website uses your browser as Python engine. Python support is limited. 
# setup the tool locally to use your own full python environment https://github.com/TeamEpochGithub/aicup-birds-radar-detection-tool`,
  filter: `import numpy as np
    
def filter(coords, times, meta):
    """
    This function filters the dataset.
    Return True to KEEP the track on the map/grid.
    Return False to HIDE the track.

    Inputs:
    - coords: (N, 4) numpy array -> [Longitude, Latitude, Altitude (m), Radar Cross Section (dB)]
    - times:  (N,) numpy array   -> Elapsed time in seconds since the track started
    - meta:   Dictionary containing all metadata columns from the CSV: track_id,timestamp_start_radar_utc,timestamp_end_radar_utc,radar_bird_size,airspeed,min_z,max_z,observation_id,primary_observation_id,observer_position,observer_comment,n_birds_observed,bird_group,bird_species and is_test
    """

    lon = coords[:, 0]
    lat = coords[:, 1]
    altitudes = coords[:, 2]
    rcs_values = coords[:, 3]

    # --- Example A: Filter by Species (Train set only) ---
    # return meta.get("bird_group") == "Birds of Prey"

    # --- Example B: Filter by Altitude ---
    # Show only tracks that fly above 200 meters at any point
    # max_alt = np.max(coords[:, 2])
    # return max_alt > 200

    # --- Example C: Complex Multi-column Filter ---
    # Show small birds (radar size) flying faster than 15 m/s
    is_small = meta.get("radar_bird_size") == "Small bird"
    is_fast = meta.get("airspeed", 0) > 15
    
    return is_small and is_fast
    
# The teamepochgithub.github.io/aicup-birds-radar-detection-tool/ website uses your browser as Python engine. Python support is limited. 
# setup the tool locally to use your own full python environment https://github.com/TeamEpochGithub/aicup-birds-radar-detection-tool`,
};

let PYODIDE = null,
  MICROPIP = null;
let RAW_DATA = { train: [], test: [] },
  SUBMISSION = {},
  ACTIVE_DATA = [];
let DECK = null,
  MAP_STYLE = "satellite",
  EDITOR_MODE = "feature",
  SELECTED_ID = null,
  VIEW_MODE = "map";
let TABLE_PAGE = 0,
  TABLE_LIMIT = 50,
  CUSTOM_COLS = [],
  DEBUG_COLS = [];
let PYTHON_FILTERED_IDS = null;
let didRunCalculateOnAllData = false;

let SORT_COL = null,
  SORT_ASC = true;
const IS_EMBED =
  new URLSearchParams(window.location.search).get("embed") === "true";
let TEST_SET_LOADED = false,
  PENDING_TEST_ACTION = null;

const editor = ace.edit("editor");
editor.setTheme("ace/theme/twilight");
editor.session.setMode("ace/mode/python");
editor.setValue(
  localStorage.getItem("bd_code_feature") || TEMPLATES.feature,
  -1,
);
editor.on("change", () => {
  didRunCalculateOnAllData = false;
  if (EDITOR_MODE === "feature") {
    localStorage.setItem("bd_code_feature", editor.getValue());
    document.getElementById("btn-update-detail").classList.remove("hidden");
  } else {
    localStorage.setItem("bd_code_filter", editor.getValue());
  }
});

// --- BINARY HELPERS ---

function parseWkb(bufferOrArray) {
  // Check for EWKB LE: 01...
  // If invalid, return empty
  if (!bufferOrArray || bufferOrArray.byteLength < 5) return [];

  // This is a naive parse of 3D/4D points from WKB
  // Structure: ByteOrder(1), Type(4), [SRID(4)], Num(4), Point...
  // We assume Little Endian (01) and known types for simplicity as per Python script

  const view = new DataView(
    bufferOrArray.buffer ? bufferOrArray.buffer : bufferOrArray,
  );
  let offset = bufferOrArray.byteOffset || 0;

  const byteOrder = view.getUint8(offset);
  offset += 1; // 1 = LE
  const type = view.getUint32(offset, true);
  offset += 4;

  const hasSRID = (type & 0x20000000) !== 0;
  const hasZ = (type & 0x80000000) !== 0;
  const hasM = (type & 0x40000000) !== 0;

  if (hasSRID) offset += 4;

  const numPoints = view.getUint32(offset, true);
  offset += 4;
  const coords = [];

  for (let i = 0; i < numPoints; i++) {
    const x = view.getFloat64(offset, true);
    offset += 8;
    const y = view.getFloat64(offset, true);
    offset += 8;
    let z = 0,
      m = 0;
    if (hasZ) {
      z = view.getFloat64(offset, true);
      offset += 8;
    }
    if (hasM) {
      m = view.getFloat64(offset, true);
      offset += 8;
    }
    coords.push([x, y, z, m]);
  }
  return coords;
}

function formatTime(unix) {
  if (!unix) return "";
  return new Date(unix * 1000).toISOString().replace("T", " ").split(".")[0];
}

function parseBinaryData(buffer, isTest) {
  const view = new DataView(buffer);
  let offset = 0;
  const rows = [];
  const days = new Set();
  const dec = new TextDecoder("utf-8");

  while (offset < buffer.byteLength) {
    // 1. Track ID (Uint32)
    const tid = view.getUint32(offset, true);
    offset += 4;

    // 2. Timestamps
    const t_start = view.getUint32(offset, true);
    offset += 4;
    const t_end = view.getUint32(offset, true);
    offset += 4;

    const strStart = formatTime(t_start);
    if (strStart) days.add(strStart.split(" ")[0]);

    // 3. Trajectory Blob
    const trajLen = view.getUint16(offset, true);
    offset += 2;
    // Copy slice to ensure alignment/validity for WKB parser
    const trajBlob = new Uint8Array(buffer.slice(offset, offset + trajLen));
    offset += trajLen;
    const coords = parseWkb(trajBlob);

    // 4. Trajectory Time Blob
    const timeLen = view.getUint16(offset, true);
    offset += 2;
    const times = [];
    for (let i = 0; i < timeLen; i++) {
      times.push(view.getFloat32(offset, true));
      offset += 4;
    }

    // 5. Radar Bird Size (Enum)
    const bsIdx = view.getUint8(offset);
    offset += 1;
    const birdSize = RADAR_SIZES[bsIdx] || "Unknown";

    // 6. Scalars
    const airspeed = view.getFloat32(offset, true);
    offset += 4;
    const min_z = view.getFloat32(offset, true);
    offset += 4;
    const max_z = view.getFloat32(offset, true);
    offset += 4;

    const meta = {
      track_id: tid.toString(),
      timestamp_start_radar_utc: strStart,
      timestamp_end_radar_utc: formatTime(t_end),
      radar_bird_size: birdSize,
      airspeed: airspeed,
      min_z: min_z,
      max_z: max_z,
      is_test: isTest,
    };

    let group = isTest ? "Test Set" : "Unknown";
    let species = "Unknown";

    if (!isTest) {
      // Train only fields
      const obsId = view.getUint32(offset, true);
      offset += 4;
      const pObsId = view.getUint32(offset, true);
      offset += 4;

      const posLen = view.getUint16(offset, true);
      offset += 2;
      offset += posLen; // Skip obs pos WKB for now (not used in UI yet)

      const comLen = view.getUint16(offset, true);
      offset += 2;
      const comment = dec.decode(buffer.slice(offset, offset + comLen));
      offset += comLen;

      const nBirds = view.getUint16(offset, true);
      offset += 2;

      const bgIdx = view.getUint8(offset);
      offset += 1;
      group = BIRD_GROUPS[bgIdx] || "Unknown";

      const spIdx = view.getUint8(offset);
      offset += 1;
      species = BIRD_SPECIES[spIdx] || "Unknown";

      meta.observation_id = obsId;
      meta.primary_observation_id = pObsId;
      meta.observer_comment = comment;
      meta.n_birds_observed = nBirds;
      meta.bird_group = group;
      meta.bird_species = species;
    }

    rows.push({
      id: tid.toString(),
      group: group,
      coords: coords,
      times: times,
      calculated: {},
      meta: meta,
    });
  }

  return { rows, days };
}

function updateEngineStatus(engine) {
  const el = document.getElementById("console-status");
  if (el) el.innerText = `Engine: ${engine}`;
}

let didToldTheUserAboutPackages = false;

/**
 * High-level Python Execution abstraction.
 * Tries local server engine if token present, otherwise uses Pyodide.
 */
async function executePython(code, globals, funcName, params) {
  // Engine Detection
  let PYTHON_TOKEN = null;
  let forced_token = false;
  if (window.location.hash.startsWith("#token=")) {
    PYTHON_TOKEN = window.location.hash.substring(7);
    forced_token = true;
  } else if (localStorage.getItem("PYTHON_TOKEN"))
    PYTHON_TOKEN = localStorage.getItem("PYTHON_TOKEN");

  if (PYTHON_TOKEN) localStorage.setItem("PYTHON_TOKEN", PYTHON_TOKEN);

  let pythonErrored = false;

  // 1. Try Local Server
  if (PYTHON_TOKEN) {
    try {
      let url = `/api/python?token=${PYTHON_TOKEN}`;
      try {
        url = new URL(PYTHON_TOKEN).toString();
      } catch { }
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, globals, funcName, params }),
      });

      const data = await response.json();
      if (!didToldTheUserAboutPackages)
        log(
          "NOTE: Using your local python environment, please install packages locally using `uv add` they will not auto-install",
          "text-slate-300",
        );
      didToldTheUserAboutPackages = true;

      updateEngineStatus("Local Server");
      if (data.stdout) log(data.stdout, "text-slate-300");
      if (data.stderr) log(data.stderr, "text-red-400");

      if (!response.ok || data.error) {
        if (!data.error)
          throw new Error(
            "Server returned an error with status: " + response.statusText,
          );
        let err = new Error(
          data.error + (data.traceback ? "\n" + data.traceback : ""),
        );
        pythonErrored = true;
        throw err;
      }

      return data.result;
    } catch (e) {
      if (pythonErrored) throw e;
      console.warn("Local server connection failed, falling back to Pyodide.");
      console.warn(e);
      log(String(e), "text-red-400");
      if (forced_token) forced_token = e || forced_token;
      else {
        try {
          localStorage.removeItem("PYTHON_TOKEN");
        } catch { }
      }
    }
  }

  if (forced_token)
    throw new Error(
      "Failed to access the local python API, remove #token= to fallback to pyodide" +
      (forced_token && typeof forced_token != "boolean"
        ? ", error: " + String(forced_token)
        : ""),
      {
        cause:
          forced_token && typeof forced_token != "boolean"
            ? forced_token
            : null,
      },
    );

  // 2. Pyodide Fallback
  if (!PYODIDE) await loadPyodideEngine();
  updateEngineStatus("Python in webbrowser (Pyodide)");

  await checkAndInstallImports(code);
  await PYODIDE.runPythonAsync(code);

  // Inject Globals
  for (const [k, v] of Object.entries(globals)) {
    PYODIDE.globals.set(k, !v || typeof v != "object" ? PYODIDE.toPy(v) : v);
  }

  if (!didToldTheUserAboutPackages)
    log(
      'NOTE: Using your browser as python engine, python support is limited. Packages usually auto-install some packages can be installed by import micropip + await micropip.install("package-name"). See https://github.com/TeamEpochGithub/aicup-birds-radar-detection-tool to use your own full python environment.',
      "text-slate-300",
    );
  didToldTheUserAboutPackages = true;

  // Call function
  if (funcName)
    return await PYODIDE.globals.get(funcName)(
      ...params.map((v) => (!v || typeof v != "object" ? PYODIDE.toPy(v) : v)),
    );

  return null;
}

async function loadPyodideEngine() {
  updateEngineStatus("Loading Pyodide...");
  log("Initializing Pyodide WASM...", "text-blue-400");
  PYODIDE = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
    stdout: (t) => log(t, "text-slate-300"),
    stderr: (t) => log(t, "text-red-400"),
  });
  await PYODIDE.loadPackage([
    "numpy",
    "scipy",
    "pandas",
    "micropip",
    "scikit-learn",
  ]);
  MICROPIP = PYODIDE.pyimport("micropip");
}

async function checkAndInstallImports(code) {
  if (!MICROPIP) return;
  const packages = [
    ...code.matchAll(/^\s*(?:import|from)\s+([a-zA-Z0-9_\-]+)/gm),
  ].map((m) => m[1]);
  for (let pkg of packages) {
    if (["math", "json", "numpy", "pandas", "scipy", "os", "sys"].includes(pkg))
      continue;
    try {
      await PYODIDE.runPythonAsync(`import ${pkg}`);
    } catch (e) {
      try {
        await MICROPIP.install(pkg);
      } catch (err) {
        console.warn(e, err);
      }
    }
  }
}

async function init() {
  try {
    if (IS_EMBED) {
      document.body.classList.add("embed-mode");
      document.getElementById("embed-controls").classList.remove("hidden");
      document
        .getElementById("embed-filter-overlay")
        .classList.remove("hidden");
    } else {
      if (!localStorage.getItem("bd_tutorial_seen")) {
        document.getElementById("help-modal").style.display = "block";
      }
    }

    // Populate Class Dropdown (Skip Unknown)
    const cleanGroups = BIRD_GROUPS.filter((g) => g !== "Unknown");
    document.getElementById("search-class").innerHTML =
      '<option value="">All Classes</option>' +
      cleanGroups.map((g) => `<option value="${g}">${g}</option>`).join("");
    document.getElementById("search-day").innerHTML =
      '<option value="">All Days</option>';
    setMapStyle("satellite");

    initMap();

    // Load Train Binary
    await loadBinary("train");

    if (!IS_EMBED) {
      document.getElementById("loader").style.opacity = "0";
      setTimeout(
        () => (document.getElementById("loader").style.display = "none"),
        500,
      );
    } else {
      document.getElementById("loader").style.display = "none";

      setTimeout(() => {
        document.getElementById("embed-search-class").innerHTML =
          document.getElementById("search-class").innerHTML;
        document.getElementById("embed-search-day").innerHTML =
          document.getElementById("search-day").innerHTML;
      }, 500);
    }
  } catch (e) {
    document.getElementById("loader-text").innerHTML =
      `<span class="text-red-400">${e.message}</span>`;
  }
}

async function loadBinary(type) {
  const res = await fetch(`${type}.bin`);
  if (!res.ok) throw new Error(`Fetch ${type}.bin failed`);
  let buffer = await res.arrayBuffer();

  if (type === "test") {
    // Decrypt
    const key = new TextEncoder().encode(XOR_KEY);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) {
      view[i] = view[i] ^ key[i % key.length];
    }
  }

  const { rows, days } = parseBinaryData(buffer, type === "test");
  RAW_DATA[type] = rows;

  const dayArr = Array.from(days).sort();
  document.getElementById("search-day").innerHTML =
    '<option value="">All Days</option>' +
    dayArr.map((d) => `<option value="${d}">${d}</option>`).join("");

  log(`Loaded ${rows.length} tracks from ${type}.bin`, "text-green-400");

  // If Train, fit map
  if (type === "train") fitMapToData(rows);
  applySimpleFilters();
}

// --- TERMS & LAZY LOAD ---

async function runFeatureCalcForSelected() {
  if (!SELECTED_ID) return;
  const track = ACTIVE_DATA.find((d) => d.id === SELECTED_ID);
  try {
    // Re-use batch logic for single item
    const results = await runBatchInPyodide([track], "calculate");
    if (results[0]) {
      track.calculated = results[0];
      let html = "";
      for (const [k, v] of Object.entries(track.calculated)) {
        if (typeof v === "object") continue;
        html += `<div class="flex justify-between border-b border-slate-700/50"><span>${k}</span><span class="text-white font-mono">${typeof v === "number" ? v.toFixed(3) : v}</span></div>`;
      }
      document.getElementById("detail-features").innerHTML = html;
      document.getElementById("btn-update-detail").classList.add("hidden"); // Hide after update
    }
  } catch (e) {
    document.getElementById("detail-features").innerHTML =
      `<span class="text-red-400 text-[10px]">${e.message}</span>`;
  }
}

async function runPythonFilter() {
  log("Running global filter (Batched)...");
  try {
    // Run on the currently selected RAW Dataset
    const source = RAW_DATA[document.getElementById("dataset-select").value];
    const CHUNK_SIZE = 1000;
    const allowedIds = new Set();

    const processSource = source; // Process all, not just slice

    for (let i = 0; i < processSource.length; i += CHUNK_SIZE) {
      const chunk = processSource.slice(i, i + CHUNK_SIZE);
      const results = await runBatchInPyodide(chunk, "filter");
      results.forEach((keep, idx) => {
        if (keep) allowedIds.add(chunk[idx].id);
      });
    }

    PYTHON_FILTERED_IDS = allowedIds;
    applySimpleFilters();
    log(`Python Filter finished. Matches: ${allowedIds.size} tracks.`);
  } catch (e) {
    log(e.message, "text-red-400");
  }
}

function renderView() {
  if (VIEW_MODE === "map") {
    document.getElementById("map-view").classList.remove("hidden");
    document.getElementById("table-view").classList.add("hidden");
    DECK.setProps({ layers: [...getBaseLayers(), getPathLayer()] });
  } else {
    document.getElementById("map-view").classList.add("hidden");
    document.getElementById("table-view").classList.remove("hidden");
    renderGrid();
  }
}

async function runFeatureCalcOnPage() {
  const start = TABLE_PAGE * TABLE_LIMIT;
  const tracks = ACTIVE_DATA.slice(start, start + TABLE_LIMIT);

  try {
    const results = await runBatchInPyodide(tracks, "calculate");
    results.forEach((res, i) => {
      if (res) tracks[i].calculated = res;
    });
    if (tracks.length > 0)
      CUSTOM_COLS = Object.keys(tracks[0].calculated).filter(
        (k) => typeof tracks[0].calculated[k] !== "object",
      );
    renderView();
  } catch (e) {
    log(e.message, "text-red-400");
  }
}

function checkTermsAndLoadTest(callback) {
  if (TEST_SET_LOADED) {
    if (callback) callback();
    return;
  }
  if (localStorage.getItem("bd_terms_accepted") === "true") {
    loadTestSet(callback);
  } else {
    PENDING_TEST_ACTION = callback;
    document.getElementById("terms-modal").style.display = "block";
  }
}

function acceptTerms() {
  if (document.getElementById("terms-dont-show").checked) {
    localStorage.setItem("bd_terms_accepted", "true");
  }
  document.getElementById("terms-modal").style.display = "none";
  loadTestSet(PENDING_TEST_ACTION);
}

function cancelTerms() {
  document.getElementById("terms-modal").style.display = "none";
  if (document.getElementById("dataset-select").value === "test") {
    document.getElementById("dataset-select").value = "train";
    switchDataset();
  }
  PENDING_TEST_ACTION = null;
  applySimpleFilters();
}

async function loadTestSet(callback) {
  if (TEST_SET_LOADED) {
    if (callback) callback();
    return;
  }
  document.getElementById("loader").style.display = "flex";
  document.getElementById("loader").style.opacity = "1";
  document.getElementById("loader-text").innerText =
    "Loading & Decrypting Test Set...";
  try {
    await loadBinary("test");
    TEST_SET_LOADED = true;
    if (callback) callback();
  } catch (e) {
    alert("Failed to load test set: " + e.message);
  } finally {
    document.getElementById("loader").style.display = "none";
  }
}

// --- OLD CSV PARSER (Keep for manual upload) ---
function parseCSVContent(text, type) {
  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = [];
      results.data.forEach((row) => {
        // ... (simplified manual parse for upload) ...
        // For brevity, using a simpler robust parse for manual uploads
        const coords = parseWkb(parseWkbHex(row["trajectory"]));
        if (!coords || coords.length < 2) return;

        let times = [];
        try {
          times = JSON.parse(row["trajectory_time"].replace(/'/g, '"'));
        } catch (e) {
          times = coords.map((_, k) => k);
        }

        const meta = { ...row, is_test: type === "test" };
        // Ensure standard fields
        meta.airspeed = parseFloat(row.airspeed) || 0;
        meta.bird_group = row.bird_group || "Unknown";
        meta.bird_species = row.bird_species || "Unknown";

        rows.push({
          id: row["track_id"],
          group: type === "test" ? "Test Set" : row["bird_group"] || "Unknown",
          coords: coords,
          times: times,
          calculated: {},
          meta: meta,
        });
      });

      RAW_DATA[type] = rows;
      log(`Loaded ${rows.length} tracks via CSV upload`, "text-blue-400");
      if (type === "train") fitMapToData(rows);
      applySimpleFilters();
    },
  });
}

function parseWkbHex(hex) {
  if (!hex) return new Uint8Array(0);
  hex = hex.replace(/^0x|^\\x/i, "");
  const buffer = new Uint8Array(
    hex.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)),
  );
  return buffer;
}

// --- STANDARD LOGIC ---

function switchDataset() {
  didRunCalculateOnAllData = false;
  const ds = document.getElementById("dataset-select").value;
  if (ds === "test" && !TEST_SET_LOADED) {
    checkTermsAndLoadTest(() => {
      PYTHON_FILTERED_IDS = null;
      applySimpleFilters();
    });
  } else {
    PYTHON_FILTERED_IDS = null;
    applySimpleFilters();
  }
}

function closeTutorialForever() {
  localStorage.setItem("bd_tutorial_seen", "true");
  document.getElementById("help-modal").style.display = "none";
}

function toggleSidebar() {
  const sb = document.getElementById("sidebar");

  // Toggle the class that moves the sidebar off-screen
  // The class '-translate-x-full' hides it. Removing it shows it.
  sb.classList.toggle("-translate-x-full");

  // Show/Hide the backdrop based on sidebar state
  if (sb.classList.contains("-translate-x-full")) {
    // Sidebar is hidden
    sb.style.visibility = "hidden";
    sb.style.opacity = "0";
    sb.style.left = "-100%";
    sb.style.setProperty("position", "absolute", "important");
  } else {
    // Sidebar is visible
    sb.style.visibility = "visible";
    sb.style.opacity = "100";
    sb.style.left = "0";
    sb.style.removeProperty("position");
  }
}

function handleFileUpload(input, type) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  if (type === "data") {
    // If .bin, parse binary, else CSV
    reader.onload = (e) => {
      if (file.name.endsWith(".bin")) {
        // Manual binary load not fully implemented in UI but logic exists
        // Fallback to CSV for manual upload as per prompt
      } else {
        parseCSVContent(
          e.target.result,
          document.getElementById("dataset-select").value,
        );
      }
    };
  } else {
    reader.onload = (e) =>
      checkTermsAndLoadTest(() => parseSubmission(e.target.result));
  }
  reader.readAsText(file);
}

function loadSampleSubmission() {
  checkTermsAndLoadTest(async () => {
    try {
      if (!RAW_DATA.test || RAW_DATA.test.length === 0) return;
      let csv = await fetch("debug_introduction_notebook_submission.csv").then(
        (t) => t.text(),
      );
      parseSubmission(csv);
      log("Loaded generated sample submission.", "text-blue-400");
    } catch (ex) {
      console.error(ex);
      alert(String(ex));
    }
  });
}

function parseSubmission(text) {
  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      SUBMISSION = {};
      const headers = results.meta.fields;
      // Exclude Unknown from debug
      DEBUG_COLS = headers.filter(
        (h) => h !== "track_id" && !BIRD_GROUPS.includes(h),
      );
      results.data.forEach((row) => {
        const tid = row["track_id"];
        if (!tid) return;
        const scores = {};
        BIRD_GROUPS.forEach((g) => {
          if (g !== "Unknown") scores[g] = parseFloat(row[g]) || 0;
        });
        const debugVals = {};
        DEBUG_COLS.forEach((c) => {
          const val = parseFloat(row[c]);
          debugVals[c] = isNaN(val) ? row[c] : val;
        });
        SUBMISSION[tid] = { scores: scores, debug: debugVals };
      });
      ["train", "test"].forEach((ds) => {
        if (RAW_DATA[ds])
          RAW_DATA[ds].forEach((t) => {
            if (SUBMISSION[t.id])
              t.meta = { ...t.meta, ...SUBMISSION[t.id].debug };
          });
      });
      document.getElementById("sub-filter-container").classList.add("xl:flex");
      document
        .getElementById("sub-filter-container-mobile")
        .classList.remove("hidden");
      log(
        `Submission loaded: ${Object.keys(SUBMISSION).length} entries.`,
        "text-purple-400",
      );
      calculateScore();
      applySimpleFilters();
    },
  });
}

async function calculateScore() {
  const train = RAW_DATA.train.filter((d) => SUBMISSION[d.id]);
  if (train.length === 0) return;
  const groups = BIRD_GROUPS.filter((g) => g !== "Unknown");
  try {
    const y_true = train.map((d) =>
      groups.indexOf(d.meta.bird_group) !== -1
        ? groups.indexOf(d.meta.bird_group)
        : -1,
    );
    // Filter out Unknowns from GT
    const validIdx = y_true
      .map((v, i) => (v !== -1 ? i : -1))
      .filter((i) => i !== -1);
    if (validIdx.length === 0) return;

    const y_t = validIdx.map((i) => y_true[i]);
    const y_s = validIdx.map((i) =>
      groups.map((g) => SUBMISSION[train[i].id].scores[g]),
    );

    const mAP = parseFloat(
      await executePython(
        `
def _calculate_score(y_true, y_score):
    from sklearn.metrics import average_precision_score
    import numpy as np
    y_t, y_s = np.array(y_true), np.array(y_score)
    aps = [average_precision_score((y_t == i).astype(int), y_s[:, i]) for i in range(len(y_s[0])) if np.sum(y_t == i) > 0]
    return float(np.mean(aps)) if aps else 0.0`,
        {},
        "_calculate_score",
        [y_t, y_s],
      ),
    );
    document.getElementById("score-status").classList.remove("hidden");
    document.getElementById("mAP-val").innerText = mAP.toFixed(4);
  } catch (e) {
    console.error(e);
    log(String(e), "text-red-400");
  }
}

function applySimpleFilters() {
  const ds = document.getElementById("dataset-select").value;
  const sid = document.getElementById("search-id").value;
  const scls = document.getElementById("search-class").value;
  const sday = document.getElementById("search-day").value;
  const onlySub = document.getElementById("limit-to-sub").checked;

  if (!RAW_DATA[ds]) {
    ACTIVE_DATA = [];
    renderView();
    return;
  }

  ACTIVE_DATA = RAW_DATA[ds].filter((d) => {
    if (PYTHON_FILTERED_IDS && !PYTHON_FILTERED_IDS.has(d.id)) return false;
    const hasSub = SUBMISSION[d.id] !== undefined;
    if (onlySub && !hasSub) return false;
    if (sid && !d.id.includes(sid)) return false;
    if (
      sday &&
      d.meta.timestamp_start_radar_utc &&
      !d.meta.timestamp_start_radar_utc.startsWith(sday)
    )
      return false;

    let effectiveGroup = d.group;
    if (ds === "test" && hasSub) {
      const scores = SUBMISSION[d.id].scores;
      const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      effectiveGroup = top[0];
      d.predictedGroup = effectiveGroup;
    }
    if (scls && effectiveGroup !== scls) return false;
    return true;
  });

  if (SORT_COL) sortData(SORT_COL, false);

  let active = false;

  for (const [filterContainerID, badgesID] of [
    ["filter-status", "filter-badges"],
    ["filter-status-mobile", "filter-badges-mobile"],
  ]) {
    const filterContainer = document.getElementById(filterContainerID);
    const badges = document.getElementById(badgesID);
    let badgeHtml = "";

    if (PYTHON_FILTERED_IDS !== null) {
      badgeHtml += `<span class="bg-orange-900/80 px-2 py-0.5 rounded text-orange-200">Python Filter</span>`;
      active = true;
    }
    if (sid || scls || sday || onlySub) {
      badgeHtml += `<span class="bg-blue-900/80 px-2 py-0.5 rounded text-blue-200">Simple Filter</span>`;
      active = true;
    }

    const hiddenClass = filterContainerID.includes("mobile")
      ? "hidden"
      : "xl:hidden";
    if (active) {
      filterContainer.classList.remove(hiddenClass);
      badges.innerHTML =
        badgeHtml +
        `<span class="opacity-70 ml-1">(${ACTIVE_DATA.length})</span>`;
    } else {
      filterContainer.classList.add(hiddenClass);
    }
  }

  const statsNotice = document.getElementById("stats-filter-notice");
  if (active && ACTIVE_DATA.length < RAW_DATA[ds].length)
    statsNotice.classList.remove("hidden");
  else statsNotice.classList.add("hidden");

  TABLE_PAGE = 0;
  renderView();

  if (ACTIVE_DATA.length == 1) selectTrack(ACTIVE_DATA[0], true);

  if (!IS_EMBED) runFeatureCalcOnPage();
}

async function sortData(col, toggle = true) {
  if (CUSTOM_COLS.includes(col) && !didRunCalculateOnAllData)
    await processAll();

  if (toggle) {
    if (SORT_COL === col) SORT_ASC = !SORT_ASC;
    else {
      SORT_COL = col;
      SORT_ASC = true;
    }
  }
  ACTIVE_DATA.sort((a, b) => {
    let va, vb;
    if (col === "id") {
      va = a.id;
      vb = b.id;
    } else if (col === "group") {
      va = a.predictedGroup || a.group;
      vb = b.predictedGroup || b.group;
    } else if (col === "pts") {
      va = a.coords.length;
      vb = b.coords.length;
    } else if (CUSTOM_COLS.includes(col)) {
      va = a.calculated[col] || -99999;
      vb = b.calculated[col] || -99999;
    } else if (DEBUG_COLS.includes(col)) {
      va = a.meta[col] || -99999;
      vb = b.meta[col] || -99999;
    } else {
      va = 0;
      vb = 0;
    }
    if (typeof va === "string")
      return SORT_ASC ? va.localeCompare(vb) : vb.localeCompare(va);
    return SORT_ASC ? va - vb : vb - va;
  });
  renderGrid();
}

// --- MAP & VISUALS ---

function fitMapToData(rows) {
  if (rows.length === 0 || !DECK) return;
  let minLat = 90,
    maxLat = -90,
    minLon = 180,
    maxLon = -180;
  const step = Math.max(1, Math.floor(rows.length / 1000));
  for (let i = 0; i < rows.length; i += step) {
    const c = rows[i].coords[0];
    if (c[1] < minLat) minLat = c[1];
    if (c[1] > maxLat) maxLat = c[1];
    if (c[0] < minLon) minLon = c[0];
    if (c[0] > maxLon) maxLon = c[0];
  }
  const latBuf = (maxLat - minLat) * 0.1;
  const lonBuf = (maxLon - minLon) * 0.1;
  DECK.setProps({
    initialViewState: {
      longitude: (minLon + maxLon) / 2 - 0.005,
      latitude: (minLat + maxLat) / 2 - 0.005,
      zoom: 14.5,
      pitch: 45,
      bearing: 0,
    },
    controller: {
      dragRotate: true,
      touchRotate: true,
      touchZoom: true,
      doubleClickZoom: true,
      inertia: true,
      minZoom: 9
    },
  });
}

function initMap() {
  DECK = new DeckGL({
    container: "map-container",
    initialViewState: {
      latitude: 53.44,
      longitude: 6.84,
      zoom: 13,
      pitch: 50,
      bearing: 0,
    },
    controller: {
      dragRotate: true,
      touchRotate: true,
      touchZoom: true,
      doubleClickZoom: true,
      inertia: true,
      minZoom: 9
    },
    layers: [...getBaseLayers(), getPathLayer()],

    // ADD THIS BLOCK:
    onClick: (info) => {
      // If user clicks the map background (not a track), hide the tooltip
      if (!info.object) {
        document.getElementById("tooltip").style.display = "none";
      }
    },
  });
}

/**
 * HIGH-RES DUTCH AERIAL MAP (PDOK)
 * We use the WMTS service which is much faster and compatible with TileLayer
 */
function getBaseLayers() {
  // PDOK high-res aerial (25cm resolution)
  const pdokAerial =
    "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg";
  const darkMap = "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";

  const url = MAP_STYLE === "dark" ? darkMap : pdokAerial;

  const tileLayer = new TileLayer({
    id: "base-tiles",
    data: url,
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    renderSubLayers: (props) => {
      const { west, south, east, north } = props.tile.bbox;
      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
      });
    },
  });

  return [tileLayer];
}

function getPathLayer() {
  return new PathLayer({
    id: "tracks",
    data: ACTIVE_DATA.slice(0, 2000),
    pickable: true,
    widthScale: 1,
    widthMinPixels: 2,
    getPath: (d) => d.coords.map((c) => [c[0], c[1], c[2]]),
    getColor: (d) => {
      if (d.id === SELECTED_ID) return [0, 255, 150, 255];
      const group = d.predictedGroup || d.group;
      const c = CATEGORY_COLORS[group] || CATEGORY_COLORS["Unknown"];
      return [c[0], c[1], c[2], 180];
    },
    getWidth: (d) => (d.id === SELECTED_ID ? 8 : 3),
    rounded: true,
    onClick: (i) => {
      if (i.object) selectTrack(i.object, true);
    },
    onHover: (i) => {
      const tt = document.getElementById("tooltip");
      if (i.object) {
        const groupName =
          i.object.group === "Test Set" && i.object.predictedGroup
            ? `Pred: ${i.object.predictedGroup}`
            : i.object.group;
        tt.style.display = "block";
        tt.style.left = i.x + "px";
        tt.style.top = i.y + "px";
        tt.innerHTML = `<div class="font-bold">${groupName}</div>ID: ${i.object.id}`;
      } else tt.style.display = "none";
    },
    updateTriggers: {
      getColor: [SELECTED_ID, ACTIVE_DATA],
      getWidth: [SELECTED_ID],
    },
  });
}

function selectTrack(track, openPanel = true) {
  if (!track) {
    closeDetail();
    return;
  }
  SELECTED_ID = track.id;
  if (VIEW_MODE === "map" && DECK)
    DECK.setProps({ layers: [...getBaseLayers(), getPathLayer()] });
  if (openPanel) {
    const detailPanel = document.getElementById("detail-panel");
    detailPanel.style.display = "block";
    detailPanel.classList.add("visible");
  }
  document.getElementById("detail-id").innerText = track.id;

  const predArea = document.getElementById("detail-sub");
  if (SUBMISSION[track.id]) {
    const scores = Object.entries(SUBMISSION[track.id].scores).sort(
      (a, b) => b[1] - a[1],
    );
    let html = `<div class="font-bold border-b border-slate-600 mb-1 pb-1">Probabilities</div>`;
    scores.forEach(([cls, score]) => {
      const percent = (score * 100).toFixed(1);
      html += `<div class="flex justify-between items-center text-[10px]"><span class="w-24 truncate">${cls}</span><div class="flex-1 flex items-center justify-end"><span class="mr-2 ${score > 0.5 ? "text-green-400 font-bold" : "text-slate-400"}">${percent}%</span><div class="w-12 h-1 bg-slate-700 rounded overflow-hidden"><div class="h-full bg-purple-500" style="width:${percent}%"></div></div></div></div>`;
    });
    predArea.innerHTML = html;
    predArea.classList.remove("hidden");
  } else predArea.classList.add("hidden");

  const exactSpecies =
    track.meta.bird_species && track.meta.bird_species !== "Unknown"
      ? ` | ${track.meta.bird_species}`
      : "";
  document.getElementById("detail-meta").innerHTML =
    `Truth: <b class="text-white">${track.group}${exactSpecies}</b>`;

  const c0 = track.coords[0];
  Plotly.newPlot(
    "detail-plot",
    [
      {
        type: "scatter3d",
        mode: "lines+markers",
        x: track.coords.map(
          (c) => (c[0] - c0[0]) * 111139 * Math.cos((c0[1] * Math.PI) / 180),
        ),
        y: track.coords.map((c) => (c[1] - c0[1]) * 111139),
        z: track.coords.map((c) => c[2]),
        customdata: track.coords.map((coord, i) => [...coord, track.times[i]]),
        line: { width: 4, color: "#3b82f6" },
        marker: {
          size: 2,
          color: track.coords.map((c) => c[3]),
          colorscale: "Viridis",
        },
        hovertemplate:
          "X: %{x:.1f}m<br>Y: %{y:.1f}m<br>Z: %{z:.1f}m<br>RCS: %{marker.color:.1f} dB/m2<br>Time: %{customdata[4]:.2f}s<br>Longitude: %{customdata[0]:.6f}<br>Latitude: %{customdata[1]:.6f}<extra></extra>",
      },
    ],
    {
      margin: { t: 0, b: 0, l: 0, r: 0 },
      paper_bgcolor: "rgba(0,0,0,0)",
      scene: {
        xaxis: { title: "X", color: "#94a3b8" },
        yaxis: { title: "Y", color: "#94a3b8" },
        zaxis: { title: "Z", color: "#94a3b8" },
        aspectmode: "data",
        camera: { eye: { x: 1.5, y: 1.5, z: 0.5 } },
      },
    },
    { displayModeBar: false },
  );

  setTimeout(() => {
    const p = document.getElementById("detail-plot");
    if (p) Plotly.Plots.resize(p);
  }, 50);
  document.getElementById("btn-update-detail").classList.add("hidden");
  if (!IS_EMBED) runFeatureCalcForSelected();
}

// ... [Include runBatchInPyodide, runStats, etc., which remain largely similar but adapted to new data struct] ...

async function runBatchInPyodide(batch, mode) {
  const funcName = mode === "filter" ? "filter" : "calculate";
  let code =
    mode === "filter"
      ? localStorage.getItem("bd_code_filter") || TEMPLATES.filter
      : EDITOR_MODE === "feature"
        ? editor.getValue()
        : localStorage.getItem("bd_code_feature") || TEMPLATES.feature;

  return (jsonRes = JSON.parse(
    await executePython(
      `
import numpy as np, json, traceback, gc, traceback
def _batch_runner(tracks, mode):
    global filter, calculate

    results = []

    if mode == 'filter': func = filter
    else: func = calculate

    if not func: return '[]'
    for t in tracks:
        try:
            c = np.array([list(coord) for coord in list(t.coords if hasattr(t, 'coords') else t['coords'])])
            tm = np.array(list(t.times if hasattr(t, 'times') else t['times']))
            if hasattr(t, 'meta'):
                m = t.meta.to_py()
            else:
                m = t['meta']
            res = func(c, tm, m)
            if mode == 'filter': res = bool(res)
            results.append(res)
            del c, tm, m
        except Exception as e: 
            traceback.print_exc()
            results.append(None)
    gc.collect()
    return json.dumps(results)
\n\n${code}`,
      {},
      "_batch_runner",
      [batch, funcName],
    ),
  ));
}

async function processAll(mode = null, collect = false) {
  let currentMode = document.getElementById("dataset-select").value;
  if (!mode) mode = currentMode;

  document.getElementById("loader").style.display = "flex";
  document.getElementById("loader").style.opacity = "1";
  document.getElementById("loader-text").innerText =
    `Processing features on the entire ${mode} dataset...`;
  try {
    const dataList = RAW_DATA[mode];
    const results = {};
    const CHUNK_SIZE = 50;
    for (let i = 0; i < dataList.length; i += CHUNK_SIZE) {
      const chunk = dataList.slice(i, i + CHUNK_SIZE);
      const calcResults = await runBatchInPyodide(chunk, "calculate");
      calcResults.forEach((res, idx) => {
        if (!res) return;
        const track = chunk[idx];
        track.calculated = res;
        if (collect) {
          for (const [k, v] of Object.entries(res)) {
            if (typeof v === "number") {
              if (!results[k]) results[k] = [];
              results[k].push({
                val: v,
                group: track.predictedGroup || track.group,
              });
            }
          }
        }
      });
    }
    if (currentMode == mode) didRunCalculateOnAllData = true;
    if (!collect) return;
    return results;
  } finally {
    document.getElementById("loader").style.display = "none";
  }
}

async function runStats(mode) {
  if (mode === "overlap" && !TEST_SET_LOADED) {
    checkTermsAndLoadTest(() => runStats(mode));
    return;
  }
  const container = document.getElementById("stats-charts");
  container.innerHTML = `<div class="col-span-2 text-center text-slate-400">Processing massive data... please wait...</div>`;

  if (mode === "class") {
    const data = RAW_DATA.train.length > 0 ? RAW_DATA.train : RAW_DATA.test;
    const metrics = await processAll("train", true);
    container.innerHTML = "";
    for (const [feat, values] of Object.entries(metrics)) {
      const div = document.createElement("div");
      div.className = "bg-slate-800 p-2 rounded h-80 border border-slate-700";
      container.appendChild(div);
      const traces = [];
      const grouped = {};
      values.forEach((v) => {
        if (!grouped[v.group]) grouped[v.group] = [];
        grouped[v.group].push(v.val);
      });
      for (const [g, vals] of Object.entries(grouped))
        traces.push({ y: vals, type: "box", name: g, boxpoints: false });

      Plotly.newPlot(
        div,
        traces,
        {
          title: { text: feat, font: { color: "#e2e8f0", size: 12 } },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "#94a3b8" },
          margin: { t: 40, b: 40, l: 40, r: 10 },
          showlegend: false,
          autosize: true,
        },
        { displayModeBar: false, responsive: true },
      );
    }
    // Trigger a resize after appending content to ensure charts fit
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  } else if (mode === "overlap") {
    const trainRes = await processAll("train", true);
    const testRes = await processAll("test", true);
    container.innerHTML = "";
    const keys = Object.keys(trainRes).filter((k) => testRes[k]);
    for (const k of keys) {
      const div = document.createElement("div");
      div.className = "bg-slate-800 p-2 rounded h-80 border border-slate-700";
      container.appendChild(div);
      const tVals = trainRes[k].map((v) => v.val);
      const sVals = testRes[k].map((v) => v.val);
      const traces = [
        {
          x: tVals,
          type: "histogram",
          name: "Train",
          opacity: 0.5,
          marker: { color: "blue" },
        },
        {
          x: sVals,
          type: "histogram",
          name: "Test",
          opacity: 0.5,
          marker: { color: "red" },
        },
      ];

      Plotly.newPlot(
        div,
        traces,
        {
          title: { text: k, font: { color: "#e2e8f0", size: 12 } },
          barmode: "overlay",
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "#94a3b8" },
          margin: { t: 40, b: 40, l: 40, r: 10 },
          legend: { x: 1, xanchor: "right", y: 1 },
          autosize: true,
        },
        { displayModeBar: false, responsive: true },
      );
    }
    // Trigger a resize
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  }
}

function getSortIndicator(col) {
  if (SORT_COL !== col) return "";
  return SORT_ASC ? " ▲" : " ▼";
}

function renderGrid() {
  const isTest = document.getElementById("dataset-select").value === "test";
  const head = document.getElementById("table-head");
  let headerHtml = `<th class="p-3 rounded-l-md" onclick="sortData('id')">Track ID${getSortIndicator("id")}</th>
            <th class="p-3" onclick="sortData('group')">${isTest ? "Hidden (Test)" : "Truth"}${getSortIndicator("group")}</th>
            <th class="p-3">Prediction</th>
            <th class="p-3 text-center" onclick="sortData('pts')">Pts${getSortIndicator("pts")}</th>`;
  CUSTOM_COLS.forEach(
    (c) =>
      (headerHtml += `<th class="p-3 text-green-400 text-center" onclick="sortData('${c}')">${c}${getSortIndicator(c)}</th>`),
  );
  DEBUG_COLS.forEach(
    (c) =>
      (headerHtml += `<th class="p-3 text-pink-400 text-center" onclick="sortData('${c}')">${c}${getSortIndicator(c)}</th>`),
  );
  head.innerHTML = headerHtml;

  const body = document.getElementById("table-body");
  const start = TABLE_PAGE * TABLE_LIMIT;
  const slice = ACTIVE_DATA.slice(start, start + TABLE_LIMIT);

  body.innerHTML = slice
    .map((d) => {
      let predHtml = "-";
      if (SUBMISSION[d.id]) {
        const top = Object.entries(SUBMISSION[d.id].scores).sort(
          (a, b) => b[1] - a[1],
        )[0];
        predHtml = `<span class="text-purple-400 font-bold">${top[0]}</span> <span class="text-slate-500 text-[10px]">(${(top[1] * 100).toFixed(0)}%)</span>`;
      }
      let dispGroup = d.group;
      if (d.group === "Test Set" && d.predictedGroup)
        dispGroup = `<span class="text-purple-400 italic">${d.predictedGroup}</span>`;
      else if (d.meta.bird_species && d.meta.bird_species !== "Unknown")
        dispGroup += ` <span class="text-[10px] text-slate-500">(${d.meta.bird_species})</span>`;
      if (isTest) dispGroup = `<span class="text-slate-600">???</span>`;

      let rowHtml = `<tr class="table-row bg-slate-800/40 border-b border-slate-800" onclick='selectTrackByID("${d.id}")'>
                <td class="p-3 font-mono text-blue-400">${d.id}</td><td class="p-3 font-semibold">${dispGroup}</td><td class="p-3">${predHtml}</td><td class="p-3 text-center">${d.coords.length}</td>`;
      CUSTOM_COLS.forEach((c) => {
        rowHtml += `<td class="p-3 text-center feat-col">${typeof d.calculated[c] === "number" ? d.calculated[c].toFixed(3) : (d.calculated[c] ?? "-")}</td>`;
      });
      DEBUG_COLS.forEach((c) => {
        const v = d.meta[c];
        rowHtml += `<td class="p-3 text-center debug-col">${typeof v === "number" ? v.toFixed(3) : (v ?? "-")}</td>`;
      });
      rowHtml += `</tr>`;
      return rowHtml;
    })
    .join("");
  document.getElementById("table-stats").innerText =
    `Showing index ${start + 1} - ${Math.min(start + TABLE_LIMIT, ACTIVE_DATA.length)} of ${ACTIVE_DATA.length}`;
}

function selectTrackByID(id) {
  const t = ACTIVE_DATA.find((x) => x.id === id);
  if (t) selectTrack(t, true);
} // Grid click -> Open Panel

function changeTablePage(dir) {
  const next = TABLE_PAGE + dir;
  if (next >= 0 && next * TABLE_LIMIT < ACTIVE_DATA.length) {
    TABLE_PAGE = next;
    renderGrid();
    runFeatureCalcOnPage();
  }
}

let log_count = 0;
let last_log = 0;
let did_msg_exhausted = false;

function log(txt, cls) {
  txt = String(txt).trim();

  let now = performance.now();
  let time_since_last_log = now - last_log;
  let rem = time_since_last_log / 100;
  if (rem >= log_count) log_count = 0;
  else log_count -= rem;
  last_log = now;

  for (let msg of String(txt).split("\n")) {
    msg = msg.trim();
    if (!msg) return;

    if (log_count > 100) {
      if (did_msg_exhausted) return;
      msg = "... [Truncated print statements for performance] ...";
      did_msg_exhausted = true;
    } else did_msg_exhausted = false;

    let max_len = 256 + (100 - log_count) * 100;
    if (msg > max_len) msg = msg.slice(0, max_len) + "...";

    const el = document.getElementById("console-output");
    el.innerHTML += `<div class="${cls} border-b border-slate-800 pb-1 mb-1">> ${msg}</div>`;
    el.scrollTop = el.scrollHeight; // Auto-scroll

    log_count++;
  }
}
function setMode(m) {
  EDITOR_MODE = m;
  document.getElementById("tab-feature").className =
    `flex-1 py-2 transition ${m == "feature" ? "mode-active bg-slate-800" : "hover:bg-slate-800"}`;
  document.getElementById("tab-filter").className =
    `flex-1 py-2 transition ${m == "filter" ? "mode-active bg-slate-800" : "hover:bg-slate-800"}`;
  document.getElementById("feature-actions").className =
    m == "feature" ? "flex gap-2" : "hidden";
  document.getElementById("filter-actions").className =
    m == "filter" ? "block" : "hidden";
  const stored =
    m === "feature"
      ? localStorage.getItem("bd_code_feature")
      : localStorage.getItem("bd_code_filter");
  editor.setValue(stored || TEMPLATES[m], -1);
}

function restoreDefault() {
  if (confirm("Restore default code for this mode?")) {
    editor.setValue(TEMPLATES[EDITOR_MODE], -1);
  }
}

function toggleMaximize() {
  const detailPanel = document.getElementById("detail-panel");
  detailPanel.style.display = "block";
  detailPanel.classList.add("visible");
  detailPanel.classList.toggle("maximized");

  setTimeout(() => {
    const plt = document.getElementById("detail-plot");
    if (plt) Plotly.Plots.resize(plt);
  }, 300);
}

function setView(v) {
  VIEW_MODE = v;
  for (const [id, set] of [
    ["btn-view-map", v == "map"],
    ["btn-view-map-mobile", v == "map"],
    ["btn-view-table", v == "table"],
    ["btn-view-table-mobile", v == "table"],
  ])
    document.getElementById(id).className =
      `btn ${set ? "bg-slate-700 text-white" : "text-slate-400"}`;

  renderView();
}
function setMapStyle(s) {
  MAP_STYLE = s;
  for (const [id, set] of [
    ["btn-style-dark", s == "dark"],
    ["btn-style-dark-mobile", s == "dark"],
    ["btn-style-sat", s == "satellite"],
    ["btn-style-sat-mobile", s == "satellite"],
  ])
    document.getElementById(id).className =
      `btn ${set ? "bg-slate-700 text-white" : 'bg-slate-800 text-slate-400"'}${id.includes("mobile") ? "" : " hidden xl:flex"}`;

  if (VIEW_MODE == "map" && DECK)
    DECK.setProps({ layers: [...getBaseLayers(), getPathLayer()] });
}
function clearFilter() {
  for (const id of ['limit-to-sub', 'limit-to-sub-mobile'])
    document.getElementById(id).checked = false;

  for (const id of [
    'search-id',
    'search-class',
    'search-day',
    'embed-search-id',
    'embed-search-class',
    'embed-search-day'
  ])
    document.getElementById(id).value = "";
  PYTHON_FILTERED_IDS = null;
  applySimpleFilters();
}
function closeDetail() {
  const element = document.getElementById("detail-panel");
  element.style.display = "none";
  element.classList.remove("visible");
  SELECTED_ID = null;
  if (VIEW_MODE == "map")
    DECK.setProps({ layers: [...getBaseLayers(), getPathLayer()] });
}

// Simple drag logic for the sidebar resizer
const resizer = document.getElementById("sidebar-resizer");
const sidebar = document.getElementById("sidebar");
let isResizing = false;

resizer.addEventListener("mousedown", (e) => {
  isResizing = true;
  document.body.style.cursor = "col-resize";
  resizer.classList.add("bg-blue-500");
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;
  // Limit width between 350px and 800px
  const newWidth = Math.min(800, Math.max(350, e.clientX));
  sidebar.style.width = newWidth + "px";
  sidebar.style.flexBasis = newWidth + "px"; // Ensure flexbox respects it

  // Trigger resize for editor and map
  if (window.editor) window.editor.resize();
});

document.addEventListener("mouseup", () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = "default";
    resizer.classList.remove("bg-blue-500");
    // Trigger map resize event so DeckGL updates
    window.dispatchEvent(new Event("resize"));
  }
});

window.addEventListener("DOMContentLoaded", () => {
  if (window.innerWidth < 768) toggleSidebar();
});

window.addEventListener("click", (e) => {
  if (e.target && !document.getElementById("map-container").contains(e.target))
    document.getElementById("tooltip").style.display = "none";
});

window.addEventListener("mouseup", (e) => {
  if (e.target && !document.getElementById("map-container").contains(e.target))
    document.getElementById("tooltip").style.display = "none";
});

window.addEventListener("touchend", (e) => {
  const touch = e.changedTouches[0];
  const element = document.elementFromPoint(touch.clientX, touch.clientY);

  if (!element) return;

  if (!document.getElementById("map-container").contains(element))
    document.getElementById("tooltip").style.display = "none";
});

init();
