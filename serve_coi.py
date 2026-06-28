#!/usr/bin/env python3
"""
Minimal HTTP server that serves the current directory with the headers
required for crossOriginIsolated = true:

    Cross-Origin-Opener-Policy: same-origin
    Cross-Origin-Embedder-Policy: require-corp
    Cross-Origin-Resource-Policy: same-origin

Run with: python3 serve_coi.py [port]
Default port: 8000

Then open http://127.0.0.1:8000/harness.html in mobile Brave on the SAME
device this server is running on (e.g. via Termux). Browsers treat
localhost/127.0.0.1 as a secure context even over plain HTTP, so this
works without setting up TLS.
"""
import http.server
import socketserver
import sys


class COIRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        # Avoid caching stale results while iterating
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        # Quieter logging, comment this out if you want full request logs
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with socketserver.TCPServer(("0.0.0.0", port), COIRequestHandler) as httpd:
        print(f"Serving with COOP/COEP on http://127.0.0.1:{port}/harness.html")
        print("Open that URL in mobile Brave on this same device. Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
