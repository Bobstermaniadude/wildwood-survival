from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent/'assets'/'models'
class Handler(BaseHTTPRequestHandler):
 def do_OPTIONS(self):
  self.send_response(204);self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:8087');self.send_header('Access-Control-Allow-Methods','POST, OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type');self.end_headers()
 def do_POST(self):
  name=self.path.strip('/');n=int(self.headers.get('Content-Length',0))
  if name not in {'survivor','husk','bow','meat-loot','pearl-core','hide-loot','fiber-loot'} or n>10000000:self.send_error(400);return
  b=self.rfile.read(n)
  if b[:4]!=b'glTF':self.send_error(400);return
  (ROOT/(name+'.glb')).write_bytes(b)
  self.send_response(200);self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:8087');self.end_headers();self.wfile.write(b'ok')
HTTPServer(('127.0.0.1',8091),Handler).serve_forever()
