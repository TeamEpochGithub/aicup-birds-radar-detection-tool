# 🦅 BirdRadar - AI Cup 2026 Bird Track Radar

**BirdRadar** is a powerful, serverless, single-file HTML application designed for auditing, visualizing, and feature engineering radar track data for the AI Cup 2026.

It runs entirely in your browser using **WebAssembly (Pyodide)**, allowing you to write Python code to filter tracks and calculate features on the fly without installing a local Python environment.

Website [https://birds.teamepoch.ai/](https://birds.teamepoch.ai/)

## Key Features

* **Zero-Install:** Just open `index.html` in your browser.
* **3D Visualization:** Inspect flight paths, altitudes, and RCS values using Deck.gl and Plotly.
* **In-Browser Python Engine:** Write Python code to engineer features and filter data. Changes reflect instantly in the grid.
* **Submission Auditing:** Upload your `submission.csv`. The app calculates your **mAP score** locally and allows you to filter the map by specific predictions.
* **Debug Columns:** Inject internal model states (embeddings, cluster IDs) into your submission CSV to visualize them alongside ground truth.
* **Statistics Lab:** Analyze Covariate Shift by comparing Feature Distributions between Train and Test sets.
* **Performance:** Uses IndexedDB for aggressive data caching (instant reloads) and batched WASM processing.

## Quick Start

1. **Clone the repo:**
```bash
git clone https://github.com/TeamEpochGithub/aicup-birds-radar-detection-tool.git
cd aicup-birds-radar-detection-tool
```


2. **Add Data:**
Place your `train.csv` and `test.csv` in the root folder from [https://www.kaggle.com/competitions/ai-cup-2026-performance/data](https://www.kaggle.com/competitions/ai-cup-2026-performance/data)

3. **Run:**
Because the app fetches CSV files and uses WebAssembly, it works best when served via a local server (to avoid CORS issues).
```bash
# Python 3
python -m http.server 8000

```


Then open `http://localhost:8000` in your browser.
*> **Note:** You can also drag-and-drop CSV files directly into the UI if you don't want to run a local server.*

## Python API Guide

BirdRadar allows you to write Python functions directly in the sidebar to interact with the data.

### 1. Feature Calculator

Used to create new columns in the Grid View.

**Function Signature:**

```python
def calculate(coords, times, meta):
    """
    coords: numpy array (N, 4) -> [Longitude, Latitude, Altitude, RCS]
    times:  numpy array (N,)   -> Relative seconds [0.0, 2.5, ...]
    meta:   dictionary         -> CSV columns (airspeed, timestamps, debug cols)
    """
    import numpy as np
    
    # Calculate custom logic
    z_values = coords[:, 2]
    
    # Return a dictionary of numbers
    return {
        "max_altitude": float(np.max(z_values)),
        "duration": float(times[-1] - times[0]),
        "climb_rate": float(np.max(np.diff(z_values)))
    }

```

### 2. Python Filter

Used to filter the dataset based on complex logic.

**Function Signature:**

```python
def filter(coords, times, meta):
    import numpy as np
    
    # Return True to keep the track, False to hide it
    avg_alt = np.mean(coords[:, 2])
    
    # Example: Show only high-flying tracks
    return avg_alt > 100

```

## Submission & Debugging

### Standard Submission

Upload a standard submission file to see your mAP score and visualize predicted classes vs ground truth.

```csv
track_id,Clutter,Cormorants,Pigeons,Ducks,Geese,Gulls,Birds of Prey,Waders,Songbirds
12,0.1,0.0,0.0,0.8,0.1,0.0,0.0,0.0,0.0

```

### Debug / Enhanced Submission

You can inject **extra columns** into your submission file to debug your model. BirdRadar automatically detects these as "Debug Columns" and renders them in **Pink** in the table.

```csv
track_id, ...[classes]... ,cluster_id,embedding_x,outlier_score
12, ...[probs]... ,5,0.882,-1.2

```

* These columns become accessible in the Python engine via `meta['cluster_id']`.

## 🛠️ Built With

* **Pyodide:** Python 3.11 running in WebAssembly.
* **Deck.gl:** High-performance WebGL map rendering.
* **MapLibre:** Base vector maps.
* **Plotly.js:** 3D Scatter plots and statistical charts.
* **TailwindCSS:** Styling.
* **Ace Editor:** Code editing.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)