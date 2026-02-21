# 🦅 BirdRadar - AI Cup 2026 Bird Track Radar

**BirdRadar** is a powerful web application designed for auditing, visualizing, and feature engineering radar track data for the [AI Cup 2026](https://www.teamepoch.ai/ai-cup-2026/).

👉 Go the website to view the tool [https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/](https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/)

## Key Features

* **3D Visualization:** Inspect flight paths, altitudes, and RCS values using Deck.gl and Plotly.
* **In-Browser Python Engine:** Write Python code to engineer features and filter data. Changes reflect instantly in the grid.
* **Submission Auditing:** Upload your `submission.csv`. The app calculates your **mAP score** locally and allows you to filter the map by specific predictions.
* **Debug Columns:** Inject internal model states (embeddings, cluster IDs) into your submission CSV to visualize them alongside ground truth.
* **Statistics Lab:** Analyze Covariate Shift by comparing Feature Distributions between Train and Test sets.

## Quick Start

0. **Website**:
You can open the tool in your browser [https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/](https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/)

If you want to use your local python environment instead, then install the repository locally.

1. **Clone the repo:**
```bash
git clone https://github.com/TeamEpochGithub/aicup-birds-radar-detection-tool.git
cd aicup-birds-radar-detection-tool
```

2. **Local Installation:**
    1. [Astral's UV](https://docs.astral.sh/uv/)

    ```bash
    uv sync
    uv run app.py
    ```

    2. [Anaconda](https://www.anaconda.com/download)

    ```bash
    conda create --prefix .venv python=3.14
    conda activate ./.venv
    pip3 install -r requirements.txt
    python3 app.py
    ```

    3. Just python

    ```bash
    python3 -m venv .venv

    # On macOS / Linux:
    source .venv/bin/activate

    # On Windows (PowerShell):
    .venv\Scripts\Activate.ps1

    pip3 install -r requirements.txt

    python3 app.py
    ```

3. **Open in your browser**

You get an output as follow:
```text
======================================================================
BIRD RADAR DEVELOPMENT SERVER
URL: http://localhost:8000/#token=TOKEN
Engine: Local Python execution enabled via /api/python
======================================================================
```

Open the printed URL with token in your browser. Confirm that local python environment is used _Engine: Local Server_ in the status bar.

4. **Static site:**

The app can also be hosted as static site (e.g using nginx, github pages). The python code will then be executed in the user's browser using Pyodide instead on the server, allowing it to be safely shared with other users.

Performance is decent in pyodide but some advanced python functionalities and libraries edge cases might not function.

Required files to statically serve:
- index.html (ensure / is served as index.html)
- birdradar.js
- birdradar.compiled.css (compiled from tailwind's birdradar-tailwind.css)
- train.bin
- favicon.ico
- favicon.png
- test.bin (optional)
- debug_introduction_notebook_submission.csv (optional)

This is used for the [Github Pages](https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/) version
of the website. 

For embedding the site see [embedding.md](embedding.md)

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

Upload a standard submission file to visualize your predicted classes.

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

### Train rows

The submission csv for the website can contain extra rows of the train set. The website will then also plot the predicted score against train rows, with the ground truth, and calculate a mean average score. Its useful to put your local cross validation test rows in here.

Rember that such a enhanced submission csv is invalid for kaggle. Ensure your pipeline creates a stripped submission csv with only probalities for the test data for Kaggle scoring.

See [introduction_workshop.py](introduction_workshop.py)

## 🛠️ Built With

* **Pyodide:** Python 3.14 running in WebAssembly.
* **Deck.gl:** High-performance WebGL map rendering.
* **MapLibre:** Base vector maps.
* **Plotly.js:** 3D Scatter plots and statistical charts.
* **TailwindCSS:** Styling.
* **Ace Editor:** Code editing.

### Compiling tailwind css

```bash
curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64

# Make it executable (on unix)
chmod +x tailwindcss-linux-x64

# Compile your CSS
./tailwindcss-linux-x64 -i ./birdradar-tailwind.css -o ./birdradar.compiled.css --content "./index.html,./birdradar.js" --minify
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

* Source code is licensed under [MIT](https://choosealicense.com/licenses/mit/)
* The train dataset falls under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) with the attribution 
described in [LICENSE](LICENSE)
* The test dataset falls under [AI Cup 2026 competition rules](https://www.kaggle.com/competitions/ai-cup-2026-performance/rules), please remove these files for any derivative work of this repository.
* Reserved names are excluded from open source licenses

See [LICENSE](LICENSE) for precise definitions

Author: Reindert Pelsma [reindertpelsma@teamepoch.net](mailto:reindertpelsma@teamepoch.net)
