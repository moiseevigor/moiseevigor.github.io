/* The general application experiment uses the same component as the proof explorer. */
(function(host){
 'use strict';const panel=document.getElementById('pm-application-lab');if(!panel)return;const records=host.PROOF_ATLAS_APPLICATION_PORTS.records,profile=panel.querySelector('[data-app-profile]'),call=panel.querySelector('[data-app-call]'),load=panel.querySelector('[data-app-load]'),release=panel.querySelector('[data-app-release]'),out=panel.querySelector('[data-app-view]');let view=null;
 for(const [index,d]of records.entries()){const option=document.createElement('option');option.value=String(index);option.textContent=d.record.name+' · '+d.calls.length+' recorded applications';profile.append(option);}
 function clear(){view?.dispose();view=null;out.replaceChildren();}
 function open(){clear();const d=records[Number(profile.value)],c=d.calls[Number(call.value)];view=host.ProofAtlasApplicationPortView.mount(out,{descriptor:d,route:c.anchor.route});}
 function choose(){clear();call.replaceChildren();const d=records[Number(profile.value)];for(const c of d.calls){const o=document.createElement('option');o.value=String(c.index);o.textContent=c.functionLabel+' · e'+c.anchor.node+' · '+c.arguments+' supplied arguments';call.append(o);}const worked=d.calls.find(c=>c.functionLabel.replace(/^@/,'')==='JacobiData.two_sqrt_mul_le_add');call.value=String(worked?.index||0);}
 profile.onchange=choose;call.onchange=()=>{if(view)open();};load.onclick=open;release.onclick=clear;choose();host.ProofAtlasApplicationManual={getScene:()=>view?.getScene()||null,getSelection:()=>view?.getSelection()||null,getState:()=>view?.getState()||null};
})(window);
