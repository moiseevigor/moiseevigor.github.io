"""Serve the production build for concurrent browser checks, on localhost."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *_args):
        pass

class Server(ThreadingHTTPServer):
    # The library page fetches dozens of independent scripts. The default
    # five-connection queue drops requests during repeated browser navigation.
    request_queue_size = 256
    allow_reuse_address = True

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, default=Path('_site_production'))
    parser.add_argument('--port', type=int, default=8833)
    args = parser.parse_args()
    if not args.directory.is_dir() or not 1 <= args.port <= 65535:
        parser.error('An existing production directory and valid port are required')
    handler = partial(Handler, directory=str(args.directory.resolve()))
    with Server(('127.0.0.1', args.port), handler) as server:
        print(f'Production preview: http://127.0.0.1:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
