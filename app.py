import io
import os
import secrets
import struct
import json
import argparse
from collections.abc import Iterable, Mapping
from pathlib import Path
from numbers import Number
from flask import Flask, send_from_directory, abort, request, jsonify
from tee import tee_stdout_stderr

if not os.access(".env", os.R_OK):
    with open(".env", "w") as f:
        f.write(f"PYTHON_TOKEN={secrets.token_hex(16)}\n")

    try:
        os.chmod(".env", 0o600)
    except Exception:
        pass

from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Use a token for local development security.
# Define PYTHON_TOKEN in .env or a random one is generated each restart.
PYTHON_TOKEN = os.getenv("PYTHON_TOKEN", secrets.token_hex(16))

# Allowed files mapping
ALLOWED_FILES = {
    "": "index.html",  # root "/"
    "index.html": "index.html",
    "train.bin": "train.bin",
    "test.bin": "test.bin",
    "debug_introduction_notebook_submission.csv": "debug_introduction_notebook_submission.csv",
    "birdradar.js": "birdradar.js",
    "birdradar.compiled.css": "birdradar.compiled.css",
    "favicon.png": "favicon.png",
    "favicon.ico": "favicon.ico",
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


@app.route("/api/python", methods=["POST"])
def run_python():
    # Verify token from query param or header
    token = request.args.get("token") or request.headers.get("X-Python-Token")
    if token != PYTHON_TOKEN:
        return jsonify({"error": "Unauthorized: Invalid or missing token"}), 401

    data = request.json
    code = data.get("code", "")
    func_name = data.get("funcName")
    params = data.get("params", [])
    globals_data = data.get("globals", {})

    stdout = io.StringIO()
    stderr = io.StringIO()

    try:
        import numpy as np

        # Setup environment
        exec_globals = {"np": np, "json": json}
        exec_globals.update(globals_data)

        # Helper to make result JSON-serializable (handles numpy)
        def serialize(obj):
            if obj is None:
                return obj
            if isinstance(obj, str):
                return str(obj)
            if isinstance(obj, (bool, np.bool_)):
                return bool(obj)
            if isinstance(obj, (np.integer, int)):
                return int(obj)
            if isinstance(obj, (np.floating, float, Number)):
                return float(obj)
            if isinstance(obj, Mapping):
                return {k: serialize(v) for k, v in obj.items()}
            if isinstance(obj, (np.ndarray, Iterable)):
                return [
                    serialize(i)
                    for i in (obj.tolist() if hasattr(obj, "tolist") else list(obj))
                ]
            try:
                return str(obj)
            except Exception:
                return None

        with tee_stdout_stderr(stdout, stderr):
            # Execute user code to define functions
            result = exec(code, exec_globals)

            if not func_name:
                return jsonify(
                    {
                        "result": serialize(result),
                        "stdout": str(stdout.getvalue()),
                        "stderr": str(stderr.getvalue()),
                    }
                )

            func = exec_globals.get(func_name)
            if not func or not callable(func):
                return (
                    jsonify(
                        {
                            "error": f"Function '{func_name}' not found or not callable",
                            "stdout": str(stdout.getvalue()),
                            "stderr": str(stderr.getvalue()),
                        }
                    ),
                    400,
                )

            result = func(*params)

        return jsonify(
            {
                "result": serialize(result),
                "stdout": str(stdout.getvalue()),
                "stderr": str(stderr.getvalue()),
            }
        )

    except Exception as e:
        import traceback

        return (
            jsonify(
                {
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                    "stdout": str(stdout.getvalue()),
                    "stderr": str(stderr.getvalue()),
                }
            ),
            500,
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bird radar local server")

    parser.add_argument(
        "--listen",
        "-l",
        default=os.getenv("LISTEN", "127.0.0.1"),
        help="Host to bind the web server to. Defaults to localhost which means only your machine can access it. Set to 0.0.0.0 to expose the web server outside your machine",
    )
    parser.add_argument(
        "--port",
        "-p",
        default=int(os.getenv("PORT", "8000")),
        type=int,
        help="Port to bind the web server to. Defaults to port 8000",
    )

    args = parser.parse_args()

    print("\n" + "=" * 70)
    print("BIRD RADAR LOCAL SERVER")
    print(
        f"URL: http://{"localhost" if args.listen in ["0.0.0.0", "127.0.0.1", "::1", "::"] else args.listen}:{str(args.port)}/#token={PYTHON_TOKEN}"
    )
    print("Engine: Local Python execution enabled via /api/python")
    print("=" * 70 + "\n")

    app.run(debug=False, port=args.port, host=args.listen, use_reloader=False)
