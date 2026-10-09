"""Serve the included production build without installing Node dependencies."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

parser = argparse.ArgumentParser(description="Run the synthetic Pulse hackathon MVP")
parser.add_argument("--port", type=int, default=5173)
args = parser.parse_args()
root = Path(__file__).resolve().parent / "dist"
server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(SimpleHTTPRequestHandler, directory=str(root)))
print(f"Pulse preview: http://127.0.0.1:{args.port}/", flush=True)
print("Synthetic demo only. Ctrl+C stops the server.", flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
