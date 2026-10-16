from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import json,struct
ROOT=Path(__file__).resolve().parent.parent/'assets'/'models'
ALLOWED={'deer','pig','stone-sword','iron-blade','gold-blade','torch','knife','pine'}
class Handler(BaseHTTPRequestHandler):
 def do_OPTIONS(self):
  self.send_response(204);self.send_header('Access-Control-Allow-Origin','https://poly.pizza');self.send_header('Access-Control-Allow-Methods','POST, OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type');self.end_headers()
 def do_POST(self):
  name=self.path.strip('/')
  n=int(self.headers.get('Content-Length',0))
  if name not in ALLOWED or n>12000000: self.send_error(400);return
  b=self.rfile.read(n)
  if b[:4]!=b'glTF': self.send_error(400);return
  d=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
  (ROOT/(name+'.glb')).write_bytes(b)
  print(name,len(b),'clips:',[a.get('name') for a in d.get('animations',[])],flush=True)
  self.send_response(200);self.send_header('Access-Control-Allow-Origin','https://poly.pizza');self.end_headers();self.wfile.write(b'ok')
HTTPServer(('127.0.0.1',8090),Handler).serve_forever()
