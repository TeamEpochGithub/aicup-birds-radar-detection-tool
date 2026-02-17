import os
from pathlib import Path
from flask import Flask, send_from_directory, abort

app = Flask(__name__)

# Allowed files mapping
ALLOWED_FILES = {
    "": "index.html",          # root "/"
    "index.html": "index.html",
    "train.bin": "train.bin",
    "test.bin": "test.bin",
    "introduction_notebook_submission.csv": "introduction_notebook_submission.csv",
    "birdradar.js": "birdradar.js",
    "birdradar.css": "birdradar.css"
}

BASE_DIR = Path(__file__).parent.resolve()

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_file(path):
    if path not in ALLOWED_FILES:
        abort(403)  # Forbidden

    filename = ALLOWED_FILES[path]
    file_path = os.path.join(BASE_DIR, filename)

    if not os.path.isfile(file_path):
        abort(404)

    return send_from_directory(BASE_DIR, filename)


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=8000)