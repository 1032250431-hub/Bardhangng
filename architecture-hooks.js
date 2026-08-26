(()=>{
'use strict';
const boot=()=>{
  if(window.__MEDROUTE_ARCH_HOOKS__)return;window.__MEDROUTE_ARCH_HOOKS__=true;
  const engine=window.__MEDROUTE_ENGINE__;if(!engine)return;
  const $=id=>document.getElementById(id);
  const worker=new Worker('/route-worker.js');
  let pendingResolve=null;
  worker.onmessage=e=>{if(e.data?.type==='k-shortest'&&pendingResolve){pendingResolve(e.data.paths);pendingResolve=null}if(e.data?.type==='error'&&pendingResolve){pendingResolve([]);pendingResolve=null}};
  const compute=({start,target,k=3})=>new Promise(resolve=>{pendingResolve=resolve;const graph={};engine.graph.forEach((edges,node)=>{graph[node]=edges.filter(e=>!e.blocked).map(e=>({to:e.to,w:e.travelTime}))});worker.postMessage({type:'k-shortest',graph,start,target,k})});
  const button=$('mrAlternatives');
  if(button)button.onclick=async()=>{
    const specialty=$('specialty')?.value||'Cardiology';
    const originId=$('origin')?.textContent?.trim();
    const origin=engine.nodes.find(n=>n.id===originId)||engine.nodes.find(n=>n.type==='VILLAGE')||engine.nodes[0];
    const candidates=engine.hospitals.filter(h=>h.specialty.includes(specialty)&&h.doctorOnDuty!==false&&h.beds>0&&h.medicine>0);
    if(!candidates.length){window.__MEDROUTE_ALT_SHOW__?.([]);return}
    const candidateResults=[];
    for(const h of candidates.slice(0,3)){const paths=await compute({start:origin.id,target:h.nodeId,k:3});if(paths.length)candidateResults.push({hospital:h,paths})}
    candidateResults.sort((a,b)=>a.paths[0].cost-b.paths[0].cost);
    const best=candidateResults[0];
    if(!best){window.__MEDROUTE_ALT_SHOW__?.([]);return}
    const unique=[];const seen=new Set();candidateResults.forEach(group=>group.paths.forEach(p=>{const id=p.path.join('>');if(!seen.has(id)){seen.add(id);unique.push({hospital:group.hospital,...p})}}));
    const alternatives=unique.slice(0,3).map((x,i)=>({label:i===0?'FASTEST':i===1?'RESILIENT':'LOW-TRAFFIC HAZARD',hospital:x.hospital,path:x.path,cost:x.cost,delta:x.cost-unique[0].cost}));
    window.__MEDROUTE_ALT_SHOW__?.(alternatives);
  };
  window.__MEDROUTE_ALT_SHOW__=alternatives=>{
    let panel=document.querySelector('.mr-alt-panel');if(!panel){panel=document.createElement('div');panel.className='mr-alt-panel';document.body.appendChild(panel)}panel.classList.add('open');
    panel.innerHTML='<div class="mr-alt-head"><span>3 ROUTE OPTIONS / WORKER COMPUTED</span><button class="close" style="background:none;border:0;color:#718789">×</button></div>'+(!alternatives.length?'<div style="font:7px IBM Plex Mono;color:#ff8790;padding:10px 0">NO ALTERNATIVE FEASIBLE PATHS</div>':alternatives.map((x,i)=>`<div class="mr-alt-row"><span><b>${x.label}</b> · ${x.hospital.id}<small style="display:block;color:#52676a;margin-top:3px">${x.path.length} NODES · ${x.path.slice(0,4).join(' → ')}${x.path.length>4?' …':''}</small></span><b>COST ${x.cost}</b><span>${i===0?'BASE':'+'+x.delta}</span></div>`).join(''));
    panel.querySelector('.close')?.addEventListener('click',()=>panel.classList.remove('open'));
    if(window.gsap)gsap.from(panel,{y:12,opacity:0,duration:.3,ease:'power2.out'});
  };
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
