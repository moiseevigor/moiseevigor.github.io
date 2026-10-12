"""Build a complete statement-coverage audit from the exact published Lean revision.

Publish statement headers and fresh check evidence, never private theorem bodies.
Editorial clause coverage remains distinct from conditional kernel-checked declarations.
"""
import argparse,hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def sha(data):return hashlib.sha256(data).hexdigest()
def build(repo,snapshot):
    cfg=json.loads((ROOT/'research/proof-atlas/article-coverage-map.json').read_text())
    source=ROOT/'public/research/se2/conjugate_times_se2.tex';text=source.read_text();rev=cfg['researchRevision']
    build_audit=json.loads((snapshot/'build-audit.json').read_text());log=(snapshot/'coverage-check.log').read_text()
    expected={Path(p).stem for p in subprocess.check_output(['git','ls-tree','-r','--name-only',rev,'lean/SE2Conjugate/SE2Conjugate/'],cwd=repo,text=True).splitlines()if p.endswith('.lean')}
    assert len(expected)==15 and {m['module']for m in build_audit['modules']}==expected
    assert all(m['exitCode']==0 for m in build_audit['modules'])
    modules={}
    for module in sorted(expected):
        data=(snapshot/'SE2Conjugate'/f'{module}.lean').read_bytes()
        pinned=subprocess.check_output(['git','show',rev+':lean/SE2Conjugate/SE2Conjugate/'+module+'.lean'],cwd=repo)
        assert data==pinned,module
        assert not re.search(r'\b(?:sorry|admit)\b|^axiom\s',data.decode(),re.M),module
        modules[module]={'sourceSha256':sha(data),'build':'PASS'}
    declarations=[];selected={d['name']:d for r in cfg['statements']for d in r['declarations']}
    selected.update({d['name']:d for d in cfg['supportDeclarations']})
    for name,record in sorted(selected.items()):
        module=record['module'];lines=(snapshot/'SE2Conjugate'/f'{module}.lean').read_text().splitlines();short=name.rsplit('.',1)[1]
        matches=[i for i,line in enumerate(lines)if re.match(r'^(?:theorem|def) '+re.escape(short)+r'(?:\s|:)',line)]
        assert len(matches)==1,name
        start=matches[0];kind=lines[start].split()[0];header=[]
        for line in lines[start:]:
            if ':='in line or re.search(r'\bwhere\s*$',line):
                header.append(re.split(r':=|\bwhere\s*$',line,maxsplit=1)[0].rstrip());break
            header.append(line)
        ax=re.search("'"+re.escape(name)+r"' depends on axioms: \[([^\]]*)\]",log);assert ax,name
        axioms=[a.strip()for a in ax[1].split(',')if a.strip()];assert set(axioms)<={'propext','Classical.choice','Quot.sound'},name
        checked=re.search(r'^'+re.escape(name)+r'\b.*?(?=\n\''+re.escape(name)+r"' depends)",log,re.S|re.M);assert checked,name
        namespace=name.rsplit('.',1)[0]
        context=[line.strip()for line in lines[:start]if line.startswith('variable ')]
        declarations.append({'name':name,'short':short,'module':module,'kind':kind,
            'sourceFile':'SE2Conjugate/'+module+'.lean','sourceSha256':modules[module]['sourceSha256'],
            'context':'namespace '+namespace+'; '+('; '.join(context[-2:])if context else 'parameters appear in the declaration'),
            'lines':[{'number':start+i+1,'text':line}for i,line in enumerate(header)],
            'sha256':sha('\n'.join(header).encode()),'checkedType':checked[0].strip(),'axioms':axioms,'kernelCheck':'PASS','termGraph':False})
    # Enumerate every numbered statement independently of the hand-written coverage map.
    found=[];section=0;counter=0
    events=re.compile(r'\\section(\*)?\{[^}]+\}|\\begin\{(lemma|theorem|remark)\}(?:\[([^\]]*)\])?')
    for event in events.finditer(text):
        if event[0].startswith(r'\section'):
            if not event[1]:section+=1;counter=0
            continue
        counter+=1;kind=event[2];end=text.index(r'\end{'+kind+'}',event.end())
        body=text[event.end():end];label=re.search(r'\\label\{([^}]+)\}',body)
        anchor=label[1]if label else'remark-late-folds'
        found.append({'number':f'{section}.{counter}','htmlAnchor':anchor,'sourceLines':[text[:event.start()].count('\n')+1,text[:end].count('\n')+1],'excerptSha256':sha(text[event.start():end+len(r'\end{'+kind+'}')].encode())})
    assert len(found)==9
    assert [(s['number'],s['htmlAnchor'])for s in cfg['statements']]==[(s['number'],s['htmlAnchor'])for s in found]
    for record,position in zip(cfg['statements'],found):record.update(position)
    data={'format':'ProofAtlasArticleCoverage/1','articleSha256':sha(source.read_bytes()),'researchRevision':rev,
        'leanVersion':'4.33.1','mathlibRevision':'0df444a360eaa60ab8c11dca51a86af692955474',
        'auditDate':'2026-10-12','modules':modules,'statements':cfg['statements'],'declarations':declarations,
        'supportDeclarations':cfg['supportDeclarations'],'counts':{'statements':9,'partial':5,'notFormalized':4,'additionalDeclarations':len(declarations),'sourceLines':sum(len(d['lines'])for d in declarations)},
        'scope':'All nine numbered article statements audited. Partial means checked conditional counterparts for specified clauses, not the complete article statement. Kernel checking does not certify the editorial article-to-Lean equivalence. Only the crossing term graph is released.',
        'checkLogSha256':sha(log.encode()),'moduleBuildSeconds':build_audit['elapsedSeconds']}
    (ROOT/'public/data/proof-atlas/article-coverage.js').write_text('/* Version-bound clause coverage and freshly checked original Lean statement headers. */\nwindow.PROOF_ATLAS_ARTICLE_COVERAGE='+json.dumps(data,ensure_ascii=True,separators=(',',':'))+';\n')
    (ROOT/'research/proof-atlas/article-coverage-audit.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'research/proof-atlas/article-coverage-lean-check.log').write_text(log)
    print(json.dumps(data['counts']))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--repository',type=Path,required=True);p.add_argument('--snapshot',type=Path,required=True);a=p.parse_args();build(a.repository,a.snapshot)
