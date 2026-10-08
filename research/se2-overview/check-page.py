"""Verify math survives Markdown, strict KaTeX, and local link destinations."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re,sys,json,subprocess
root=Path(__file__).resolve().parents[2]
output=Path(sys.argv[1]); katex=Path(sys.argv[2])
file=root/'_posts/2026-10-08-shortest-paths-se2-overview.md'
source=file.read_text().split('---',2)[2]
class Article(HTMLParser):
 def __init__(self):super().__init__();self.active=False;self.text='';self.links=[];self.ids=set();self.figures=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='article' and a.get('class')=='d-article':self.active=True
  if 'id' in a:self.ids.add(a['id'])
  if self.active:
   if tag=='a':self.links.append(a.get('href',''))
   if tag=='figure':self.figures+=1
 def handle_endtag(self,tag):
  if tag=='article':self.active=False
 def handle_data(self,text):
  if self.active:self.text+=text
page=Article();page.feed((output/'mathematics/se2-explained/index.html').read_text())
pattern=re.compile(r'\$\$(.*?)\$\$|(?<!\$)\$(?!\$)(.*?)\$(?!\$)|\\\[(.*?)\\\]',re.S)
formulas=lambda s:[re.sub(r'\s+','',''.join(parts)) for parts in pattern.findall(s)]
a,b=formulas(source),formulas(page.text)
assert a==b,'Formula content changed during Markdown rendering'
tex=[''.join(parts) for parts in pattern.findall(page.text)]
script='const K=require(process.argv[1]),fs=require("fs");for(const tex of JSON.parse(fs.readFileSync(0,"utf8")))K.renderToString(tex,{throwOnError:true,strict:"error"});'
subprocess.run(['node','-e',script,str(katex)],input=json.dumps(tex),text=True,check=True)
local=0
for link in page.links:
 u=urlsplit(link)
 if u.scheme or u.netloc:continue
 if u.path:
  p=output/unquote(u.path).lstrip('/');p=p/'index.html' if not p.suffix else p
  assert p.exists(),link
 elif u.fragment:assert unquote(u.fragment) in page.ids,link
 local+=1
assert page.figures==5
print(json.dumps({'formulas':len(tex),'strict_katex_errors':0,'local_links':local,'figures':page.figures}))
