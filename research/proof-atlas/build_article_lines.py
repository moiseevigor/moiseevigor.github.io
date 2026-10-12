"""Publish original statement line breaks for the already public declaration headers.

Proof bodies are excluded. Require exact agreement with the released header text
and its starting line; never assign a source line number to a pretty-printed term.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def assigned(path,name):
    return json.loads(path.read_text().split('window.'+name+'=')[1].rstrip(';\n'))
def build(source):
    original=source.read_bytes();lines=original.decode().splitlines()
    declarations=assigned(ROOT/'public/data/proof-atlas/crossing-declarations.js','PROOF_ATLAS_DECLARATIONS')
    index=assigned(ROOT/'public/data/proof-atlas/crossing-article-index.js','PROOF_ATLAS_ARTICLE_INDEX')
    names={name for passage in index['passages']for name in passage['declarations']}
    snippets=[]
    for d in declarations['nodes']:
        if d['name']not in names:continue
        start=d['line']-1;collected=[]
        assert lines[start].startswith(d['kind']+' '+d['short']),d['name']
        for line in lines[start:]:
            if d['kind']=='theorem'and ':='in line:
                collected.append(line.split(':=',1)[0].rstrip());break
            collected.append(line)
            if d['kind']=='def':break
        header=' '.join(' '.join(collected).split())
        assert header==d['kind']+' '+' '.join(d['statement'].split()),d['name']
        snippets.append({'name':d['name'],'short':d['short'],'kind':d['kind'],
            'lines':[{'number':start+i+1,'text':line}for i,line in enumerate(collected)],
            'sha256':hashlib.sha256('\n'.join(collected).encode()).hexdigest()})
    assert {d['name']for d in snippets}==names
    data={'format':'ProofAtlasArticleLines/1','articleSha256':index['source']['sha256'],
        'sourceFile':'SE2Conjugate/Crossing.lean','sourceSha256':hashlib.sha256(original).hexdigest(),
        'context':'namespace CrossingData; variable (C : CrossingData)',
        'scope':'Original statement lines for ten already public declaration headers. Theorem proof bodies and their := delimiters are excluded. Passage alignment is curated, not a sentence-by-sentence formal certificate.',
        'declarations':snippets}
    output=ROOT/'public/data/proof-atlas/crossing-article-lines.js'
    output.write_text('/* Original source statement lines, checked against the public declaration headers. */\nwindow.PROOF_ATLAS_ARTICLE_LINES='+json.dumps(data,ensure_ascii=True,separators=(',',':'))+';\n')
    print(json.dumps({'declarations':len(snippets),'sourceLines':sum(len(d['lines'])for d in snippets)}))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--lean-source',type=Path,required=True)
    build(parser.parse_args().lean_source)
