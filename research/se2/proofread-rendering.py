"""Check SE(2) formula preservation through Jekyll and strict KaTeX rendering.
Usage: python research/se2/proofread-rendering.py SITE_OUTPUT KATEX_CJS
Use the same KaTeX version as _includes/head.html (0.16.9).
"""
from pathlib import Path
from html.parser import HTMLParser
import json
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[2]
out, katex = map(Path, sys.argv[1:3])
class Content(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_article, self.text, self.tables = False, '', 0
    def handle_starttag(self, tag, attrs):
        if tag == 'article' and 'd-article' in dict(attrs).get('class', ''):
            self.in_article = True
        if self.in_article and tag == 'table':
            self.tables += 1
    def handle_endtag(self, tag):
        if tag == 'article':
            self.in_article = False
    def handle_data(self, text):
        if self.in_article:
            self.text += text

pattern = re.compile(r'\$\$(.*?)\$\$|(?<!\$)\$(?!\$)(.*?)\$(?!\$)|\\\[(.*?)\\\]|\\\((.*?)\\\)', re.S)
normalize = lambda tex: re.sub(r'\s+', '', tex)
files = [root/'_posts/2026-10-07-se2-geodesics-research-program.md',
         *sorted((root/'_articles').glob('2026-10-07-se2-*.md'))]
assert len(files) == 4
pages = []
for file in files:
    raw = file.read_text()
    body = raw.split('---', 2)[2]
    path = re.search(r'^permalink: (.+)$', raw, re.M).group(1)
    expected = [''.join(parts) for parts in pattern.findall(body)]
    parser = Content()
    parser.feed((out/path.strip('/')/'index.html').read_text())
    actual = [''.join(parts) for parts in pattern.findall(parser.text)]
    assert list(map(normalize, expected)) == list(map(normalize, actual)), file
    assert parser.tables == (1 if file.parent.name == '_posts' else 0), file
    pages.append(dict(path=path, formulas=actual, tables=parser.tables))
script = r'''
const fs=require('fs'),katex=require(process.argv[1]);
const pages=JSON.parse(fs.readFileSync(0,'utf8'));
if(katex.version !== '0.16.9') throw Error('Wrong renderer version');
for(const p of pages)for(const tex of p.formulas)katex.renderToString(tex,{throwOnError:true,strict:'error'});
console.log(JSON.stringify({pages:pages.map(p=>({path:p.path,formulas:p.formulas.length,tables:p.tables})),total_formulas:pages.reduce((n,p)=>n+p.formulas.length,0),katex_version:katex.version,errors:0},null,2));
'''
result = subprocess.check_output(['node', '-e', script, str(katex.resolve())], input=json.dumps(pages), text=True)
print(result, end='')
