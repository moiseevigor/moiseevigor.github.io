"""Extract exact passages from the already public manuscript snapshot.

Alignment is curated correspondence, not kernel-certified semantic equivalence.
Changing either source requires review, not fuzzy rematching of old anchors.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def build():
    source = ROOT / 'public/research/se2/conjugate_times_se2.tex'
    raw = source.read_bytes()
    text = raw.decode()
    provenance = json.loads((source.parent/'se2-provenance.json').read_text())
    assert sha(raw) == provenance['manuscripts']['conjugate_times_se2']['source_sha256']
    start = text.index('\\begin{lemma}[Crossing principle]\\label{lem:crossing}')
    end = text.index('\\end{proof}', start)
    section = text[start:end]
    entries = []
    def passage(id, title, begin, finish, declarations, note, anchor='lem:crossing'):
        region = section if anchor == 'lem:crossing' else text
        assert region.count(begin) == 1, id
        a = text.index(begin, start) if anchor == 'lem:crossing' else text.index(begin)
        b = text.index(finish, a)+len(finish)
        excerpt = text[a:b]
        entries.append(dict(id=id,title=title,anchor=anchor,raw=excerpt,
            pdfPage=5 if anchor == 'lem:crossing' else 15,
            sourceLines=[text[:a].count('\n')+1,text[:b].count('\n')+1],
            excerptSha256=sha(excerpt.encode()),declarations=declarations,note=note))
    passage('phase-equation','The phase equation',
        r'write $\psi_\sigma(p)=\sigma u(p)-p$',r'$\sigma=\pm1$.',
        ['CrossingData.branch','CrossingData.psiP','CrossingData.psiM'],
        'Lean’s branch definition is σ u(p) − p. In the lifted equality with ψ + 2K n, the integer n represents the period shift explicitly.')
    passage('counting','Exactly one crossing',
        r"Then $p''-p'<K$",'Both signs represent the same point at either endpoint.',
        ['CrossingData.crossing'],
        'The article’s theorem table explicitly names crossing as the counting clause. The Lean theorem uses the orientation u(lo) = 0 and u(hi) = K and assumes strict branch monotonicity in CrossingData; this link does not include the lemma’s analytic clauses.')
    passage('bracket','The bracket is shorter than K',
        r"Since $|u'|\ge1$",r"equality would force $|u'|\equiv1$.",
        ['CrossingData.hi_sub_lo_lt'],
        'The article derives the bound analytically. The Lean lemma obtains the same bound from the strict monotonicity and endpoint fields of CrossingData; the derivations have different hypotheses.')
    passage('monotonicity','Why the branches are strictly monotone',
        r"The slopes are $\psi_\sigma'=\sigma u'-1$",r"on any subinterval because $|u'|$ is unbounded.",
        ['CrossingData.psiP_strictMono','CrossingData.psiM_strictAnti'],
        'These Lean lemmas expose monotonicity fields already assumed in CrossingData. This excerpt explains the article’s analytic reason for those fields; it is not a proof extracted from those Lean lemma bodies.')
    passage('arcs','The two arcs cover one period',
        'The two branches sweep the','is attained exactly once.',
        ['CrossingData.exists_branch','CrossingData.unique_branch','CrossingData.eq_of_branch_eq'],
        'One article paragraph combines coverage, uniqueness and endpoint gluing. Lean separates it into several declarations. These are curated argument links, not sentence-by-sentence formal certificates.')
    passage('analytic-scope','Analytic conclusions outside this formalization',
        'Not formalized: the analytic clauses',r'order of the zeros, the finiteness of the tangency phases)',[],
        'This manuscript snapshot explicitly excludes these analytic clauses from its Lean coverage. The crossing export contains no proof of them.',anchor='app:lean')
    # The author’s existing article-to-Lean table is independent evidence for the counting link.
    table_line = next(i+1 for i,line in enumerate(text.splitlines()) if r'\texttt{crossing} (\texttt{Crossing})' in line)
    core = json.loads((ROOT/'public/data/proof-atlas/crossing-terms.js').read_text().split('window.PROOF_ATLAS_TERMS=')[1].rstrip(';\n'))
    structure = json.loads((ROOT/'public/data/proof-atlas/crossing-structure.js').read_text().split('window.PROOF_ATLAS_DATA=')[1].rstrip(';\n'))
    children=[[] for _ in structure['parent']]
    for i,p in enumerate(structure['parent']):
        if p>=0: children[p].append(i)
    fields={'app':['fn','arg'],'lam':['domain','body'],'forallE':['domain','body']}
    paths=[]
    for i,p in enumerate(structure['parent']):
        paths.append(core['rootPaths'][structure['roots'].index(i)] if p<0 else paths[p]+'.'+fields[structure['kinds'][int(structure['kind'][p])]][children[p].index(i)])
    anchors=[dict(occurrence=i,path=paths[i],passage=p,relation=r) for i,p,r in [
        (0,'counting','Enclosing theorem statement'),(203,'counting','Enclosing counting proof'),
        (1852,'phase-equation','Selected lifted phase equality')]]
    return dict(format='ProofAtlasArticleIndex/1',source=dict(
        title='All Conjugate Times of the Rotating Geodesics in the Sub-Riemannian Problem on SE(2)',
        snapshotDate=provenance['snapshot_date'],sha256=sha(raw),
        url='/public/research/se2/conjugate_times_se2.tex',pdf='/public/research/se2/conjugate_times_se2.pdf',
        lemmaPdfPage=5,tableLine=table_line,articleLabel='lem:crossing',
        macros={'\\Torus':'\\mathbb T'}),
        lean=dict(theorem=core['theorem'],coregirSha256=core['source']['coregirSha256']),
        method='Exact source excerpts; curated declaration and occurrence correspondences reviewed 2026-10-12. Not kernel-certified article equivalence.',
        scope='Crossing principle only: 6 passages, 10 named declarations and 3 exact occurrence anchors. Other article statements and arbitrary expression-to-sentence alignment are not indexed.',
        passages=entries,anchors=anchors)

if __name__ == '__main__':
    target=ROOT/'public/data/proof-atlas/crossing-article-index.js'
    data=build()
    target.write_text('/* Exact public-article excerpts with curated Lean correspondence. */\nwindow.PROOF_ATLAS_ARTICLE_INDEX='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
    print(json.dumps({'passages':len(data['passages']),'anchors':len(data['anchors']),'sourceSha256':data['source']['sha256']}))
