"""Render the public manuscript as a static Distill page, using Pandoc's AST.

Preserve every mathematical expression, section, theorem, figure, table and citation.
Remove only print-only equation wrappers; retain numbers and stable source labels.
The published TeX and PDF remain unchanged. Pandoc is a build tool, not a runtime dependency.
"""
import hashlib
import html
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PAGE=ROOT/'projects/proof-atlas/article/index.html'
SOURCE=ROOT/'public/research/se2/conjugate_times_se2.tex'

def pandoc(args,data=None):
    return subprocess.run(['pandoc',*args],input=data,text=True,capture_output=True,check=True,cwd=ROOT).stdout

def build():
    text=SOURCE.read_text()
    index=json.loads((ROOT/'public/data/proof-atlas/crossing-article-index.js').read_text().split('window.PROOF_ATLAS_ARTICLE_INDEX=')[1].rstrip(';\n'))
    source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    assert index['source']['sha256']==source_hash
    # Source-positioned targets wrap the exact excerpt, preserving its text.
    # No mathematical text is rewritten to create these anchors.
    enhanced=text
    steps=json.loads((ROOT/'public/data/proof-atlas/article-proof-steps.js').read_text().split('window.PROOF_ATLAS_PROOF_STEPS=')[1].rstrip(';\n'))
    assert steps['articleSha256']==source_hash
    all_passages=[*index['passages'],*[{**p,'htmlAnchor':p['id']} for p in steps['passages']]]
    for passage in sorted(all_passages,key=lambda p:text.index(p['raw']),reverse=True):
        a=enhanced.index(passage['raw'])
        enhanced=enhanced[:a]+r'\hypertarget{'+passage['htmlAnchor']+r'}{'+passage['raw']+'}'+enhanced[a+len(passage['raw']):]
    doc=json.loads(pandoc(['-f','latex','-t','json'],enhanced))
    abstract=doc['meta']['abstract']['c']
    doc['blocks']=[{'t':'Header','c':[2,['abstract',[],[]],[{'t':'Str','c':'Abstract'}]]},*abstract,*doc['blocks']]
    numbers={};sections=[];statements=[];section=0;counter=0;appendix=False
    events=re.compile(r'\\appendix|\\section(\*)?\{([^}]+)\}|\\begin\{(lemma|theorem|remark)\}(?:\[[^\]]*\])?|\\begin\{equation\}|\\begin\{figure\}|\\begin\{table\}')
    eq=figure=table=0
    for m in events.finditer(text):
        token=m[0]
        if token==r'\appendix':appendix=True;section=0;continue
        if token.startswith(r'\section'):
            if not m[1]:section+=1;counter=0
            number='' if m[1] else chr(64+section) if appendix else str(section)
            label=re.match(r'\\label\{([^}]+)\}',text[m.end():])
            if label:numbers[label[1]]=number
            sections.append((number,m[2]));continue
        kind=m[3]
        if kind:
            counter+=1;number=(chr(64+section) if appendix else str(section))+'.'+str(counter)
            region=text[m.end():text.index(r'\end{'+kind+'}',m.end())]
            label=re.search(r'\\label\{([^}]+)\}',region)
            if label:numbers[label[1]]=number
            statements.append((kind,number));continue
        kind='equation' if 'equation' in token else 'figure' if 'figure' in token else 'table'
        region=text[m.end():text.index(r'\end{'+kind+'}',m.end())]
        if kind=='equation':eq+=1;number=str(eq)
        elif kind=='figure':figure+=1;number=str(figure)
        else:table+=1;number=str(table)
        label=re.search(r'\\label\{([^}]+)\}',region)
        if label:numbers[label[1]]=number
    math_count=0;images=[];statement_index=0;section_index=0
    preserved_math=[];proof_anchors=[];last_statement_anchor=None
    def walk(value):
        nonlocal math_count,statement_index,section_index,last_statement_anchor
        if isinstance(value,list):
            for child in value:walk(child)
            return
        if not isinstance(value,dict):return
        t=value.get('t');c=value.get('c')
        if t=='Header' and c[0]==1 and c[1][0]!='abstract':
            number,title=sections[section_index];section_index+=1
            c[0]=2
            if number:c[2].insert(0,{'t':'Str','c':number+'. '})
        if t=='Div' and set(c[0][1])&{'lemma','theorem','remark'}:
            kind,number=statements[statement_index];statement_index+=1
            if kind=='remark' and number=='5.2':c[0][0]='remark-late-folds'
            last_statement_anchor=c[0][0]
            for inline in c[1][0]['c']:
                if inline['t']=='Strong':inline['c']=[{'t':'Str','c':kind.title()+' '+number}];break
        if t=='Div' and 'proof'in c[0][1]:
            assert last_statement_anchor
            c[0][0]='proof-'+last_statement_anchor.replace(':','-');proof_anchors.append(c[0][0])
        if t=='Link':
            attrs=dict(c[0][2]);target=attrs.get('reference')
            if target in numbers:c[1]=[{'t':'Str','c':('('+numbers[target]+')') if attrs.get('reference-type')=='eqref' else numbers[target]}]
        if t=='Math':
            math_count+=1
            content=c[1];label=re.search(r'\\label\{([^}]+)\}',content)
            content=re.sub(r'\\label\{[^}]+\}','',content)
            content=content.replace(r'\begin{equation}','').replace(r'\end{equation}','')
            content=content.replace(r'\begin{align*}',r'\begin{aligned}').replace(r'\end{align*}',r'\end{aligned}')
            preserved_math.append(content.strip())
            if label:
                tag=label[1]
                math={'t':'Math','c':[c[0],content+r'\tag{'+numbers[tag]+'}']}
                value.clear();value.update({'t':'Span','c':[[tag,['pa-paper-equation'],[]],[math]]})
            else:c[1]=content
        if t=='Image':
            filename=Path(c[2][0]).stem+'.svg'
            target=ROOT/'public/research/se2/article-figures'/filename
            assert target.exists(),target
            c[2][0]='/public/research/se2/article-figures/'+filename
            alts={'manuscript_sign_chart.svg':'Cell-wise monotone quotients at k = 0.8 and k = 0.95, with the first conjugate bracket shaded.','manuscript_zero_curve.svg':'Conjugate zero-set branches and sample geodesic lines in the phase-time strip.','higher_cells_strip.svg':'The two conjugate brackets in a Maxwell cell, with geodesic crossings of the phase branches.','manuscript_first_root_map.svg':'The first conjugate time over the phase cylinder, including its endpoint extrema.'}
            c[1]=[{'t':'Str','c':alts[filename]}]
            images.append(filename)
        # A replaced Math is complete. Walking it again would double-count it.
        if t=='Math':return
        for child in value.values():walk(child)
    walk(doc['blocks'])
    def inline_proof_steps(value):
        # Pandoc turns paragraph-sized hypertargets into block Divs. Keep these
        # source annotations inline so a comma never starts an artificial paragraph.
        if isinstance(value,list):
            for child in value:inline_proof_steps(child)
        elif isinstance(value,dict):
            for child in value.values():inline_proof_steps(child)
            if value.get('t')=='Div':
                attrs,blocks=value['c']
                if attrs[0].startswith('step-'):
                    assert len(blocks)==1 and blocks[0]['t']in ('Para','Plain')
                    value.clear();value.update({'t':'Para','c':[{'t':'Span','c':[attrs,blocks[0]['c']]}]})
                elif attrs[0]in ('proof-thm-first','proof-thm-cells'):
                    assert all(block['t']=='Para' for block in blocks)
                    joined=[]
                    for block in blocks:
                        if joined:joined.append({'t':'Space'})
                        joined.extend(block['c'])
                    value['c'][1]=[{'t':'Para','c':joined}]
    inline_proof_steps(doc['blocks'])
    assert section_index==len(sections)
    assert statement_index==len(statements)
    assert len(images)==figure==4
    doc['meta']['bibliography']={'t':'MetaString','c':'public/research/se2/article-references.bib'}
    doc['meta']['link-citations']={'t':'MetaBool','c':True}
    doc['meta']['reference-section-title']={'t':'MetaString','c':'References'}
    rendered=pandoc(['-f','json','-t','html5','--mathjax','--wrap=none','--citeproc','--csl','research/proof-atlas/article-numeric.csl'],json.dumps(doc))
    rendered=rendered.replace('<h1 id="references">','<h2 id="references">').replace('</h1>','</h2>')
    # A sidebar table of contents follows the site's existing article layout.
    headers=re.findall(r'<h2 id="([^"]+)">(.*?)</h2>',rendered)
    toc='<nav class="pa-paper-toc" aria-label="Article sections"><strong>In this article</strong><ol>'+''.join('<li><a href="#'+id+'">'+title+'</a></li>' for id,title in headers)+'</ol></nav>'
    backlinks=[]
    for p in index['passages']:
        anchors=[a for a in index['anchors'] if a['passage']==p['id']]
        i=5830 if p['id']=='phase-equation' else anchors[0]['occurrence'] if anchors else None
        url=('/projects/proof-atlas/app/#expr-'+str(i)) if i is not None else '/projects/proof-atlas/app/#article-'+p['id']
        backlinks.append('<li><a href="#'+p['htmlAnchor']+'">'+html.escape(p['title'])+'</a> · <a href="'+url+'">Open in Proof Atlas ↗</a></li>')
    introduction='''<div class="pa-paper-edition" role="note"><strong>Web edition · manuscript snapshot of 7 October 2026.</strong> The manuscript text, formulas, figures and references are reproduced below. Its Lean coverage is recorded in <a href="#app:lean">Appendix A</a>. <a href="/public/research/se2/conjugate_times_se2.pdf">Original PDF</a> · <a href="/public/research/se2/conjugate_times_se2.tex">Original TeX</a> · <a href="/projects/proof-atlas/app/">Proof Atlas</a></div>'''
    coverage='<details class="pa-paper-links"><summary>Passages linked to the Lean proof atlas</summary><ul>'+''.join(backlinks)+'</ul></details>'
    front='''---
layout: distill
title: "All Conjugate Times of the Rotating Geodesics in the Sub-Riemannian Problem on SE(2)"
subtitle: "The published manuscript, with formulas and direct links to the Lean proof atlas."
permalink: /projects/proof-atlas/article/
page_class: proof-atlas-article-page
date: 2026-10-12
math: true
reference_style: bibliography
description: "Distill web edition of the published SE(2) rotating-geodesic manuscript, preserving mathematical statements, proofs, figures, references and exact Lean correspondence anchors."
---
<link rel="stylesheet" href="/public/css/proof-atlas-article.css?v=5">
'''
    content=front+'{% include proof-atlas-reading-tools.html part="toolbar" %}\n{% raw %}<div class="l-body pa-paper" data-source-sha256="'+source_hash+'">'+introduction+toc+coverage+rendered+'</div>{% endraw %}\n{% include proof-atlas-reading-tools.html part="panels" %}\n'
    class Audit(HTMLParser):
        def __init__(self):super().__init__();self.ids=[];self.targets=[];self.image_count=0
        def handle_starttag(self,tag,attrs):
            a=dict(attrs)
            if 'id'in a:self.ids.append(a['id'])
            if tag=='a'and a.get('href','').startswith('#'):self.targets.append(a['href'][1:])
            if tag=='img':self.image_count+=1
    audit=Audit();audit.feed(content)
    assert len(audit.ids)==len(set(audit.ids)),'Duplicate targets'
    assert not(set(audit.targets)-set(audit.ids)),set(audit.targets)-set(audit.ids)
    assert all(p['htmlAnchor']in audit.ids for p in all_passages)
    assert all(label in audit.ids for label in numbers),set(numbers)-set(audit.ids)
    assert audit.image_count==4
    assert 'data-cites='in rendered and 'id="refs"'in rendered
    PAGE.parent.mkdir(parents=True,exist_ok=True);PAGE.write_text(content)
    manifest={'sourceSha256':source_hash,'pandocVersion':pandoc(['--version']).splitlines()[0],
        'sections':len(sections),'statements':len(statements),'equations':eq,'figures':4,'tables':table,
        'mathExpressions':math_count,'mathContentSha256':hashlib.sha256(json.dumps(preserved_math,ensure_ascii=False).encode()).hexdigest(),
        'mathContent':preserved_math,'sourceLabels':numbers,'passageAnchors':[p['htmlAnchor']for p in index['passages']],'proofAnchors':proof_anchors,
        'method':'Pandoc AST conversion of published source; math bodies preserved with print wrappers removed and source equation numbers restored; all internal targets audited.'}
    (ROOT/'research/proof-atlas/distill-article-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({k:manifest[k]for k in ['sections','statements','equations','figures','tables','mathExpressions']}))

if __name__=='__main__':build()
