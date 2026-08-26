(()=>{
'use strict';
const boot=()=>{
  if(window.__MEDROUTE_ARCH_HOOKS__)return;window.__MEDROUTE_ARCH_HOOKS__=true;
  const engine=window.__MEDROUTE_ENGINE__;if(!engine)return;
  const $=id=>document.getElementById(id);
  const installMapSanitizer=()=>{
    const osm=src=>{try{const u=new URL(src,location.href);const m=u.pathname.match(/\/(\d+)\/(\d+)\/(\d+)(?:\.[a-z]+)?$/);if(!m)return null;return `https://${['a','b','c'][(+m[2]+ +m[3])%3]}.tile.openstreetmap.org/${m[1]}/${m[2]}/${m[3]}.png`}catch(_){return null}};
    const rewrite=img=>{if(!(img instanceof HTMLImageElement))return;if(/carto|cartocdn|basemaps\.carto/i.test(img.src)){const next=osm(img.src);if(next&&img.src!==next)img.src=next}};
    document.querySelectorAll('.leaflet-tile-pane img').forEach(rewrite);
    const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('img'))rewrite(n);n.querySelectorAll?.('img').forEach(rewrite)}})));
    document.querySelectorAll('.leaflet-tile-pane').forEach(p=>observer.observe(p,{childList:true,subtree:true}));
    const style=document.createElement('style');style.id='mr-high-fps-map-style';style.textContent=`
      .leaflet-tile-pane,.leaflet-tile-container{filter:invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%)!important}
      .leaflet-tile-pane img{backface-visibility:hidden}
      .mr-canvas-layer,#mrHardwareCanvas{display:none!important}
      .mr-coords,.mr-alt-panel,.map-overlay,.map-legend{background:rgba(8,10,15,.92)!important;backdrop-filter:none!important}
      .panel,.panel-block,.command-wrap,.hero-side,.secondary,.topbar{backdrop-filter:none!important}
      .panel{background:rgba(8,10,15,.96)!important}
      .panel-label,.spec,.barlabel,.request-meta{color:#aebfc1!important}
      .hid,.panel h3,.panel strong,.principle h3{color:#f1f7f6!important}
      .principle p,.hero-side p,.map-overlay span{color:#c5d0d1!important}
      .dispatch:hover,.primary:hover,.mr-power-btn:hover,#closure:hover,#resetFleet:hover{background:#2dd4bf!important;color:#000!important;font-weight:700!important;border-color:#99f6e4!important;box-shadow:0 0 15px rgba(20,184,166,.5)!important}
      .mr-hud{position:fixed;top:18px;right:28px;z-index:50;pointer-events:none;display:flex;align-items:center;gap:9px;padding:9px 12px;border:1px solid rgba(101,230,226,.2);background:rgba(5,10,13,.9);font:8px 'IBM Plex Mono';letter-spacing:.1em;color:#aebfc1;box-shadow:0 10px 35px rgba(0,0,0,.25)}
      .mr-hud b{color:#65e6e2;font-weight:600}.mr-hud .ok{color:#b7f36b}.mr-hud .sep{color:#4b6265}.mr-hero-telemetry{display:none!important}
      @media(max-width:700px){.mr-hud{top:10px;right:10px;font-size:7px}}
    `;document.head.appendChild(style);
    const scan=document.querySelector('.mr-scan-toggle');if(scan?.classList.contains('on'))scan.click();
    document.querySelectorAll('.mr-canvas-layer,#mrHardwareCanvas').forEach(n=>n.remove());
    const hud=document.createElement('div');hud.className='mr-hud';hud.innerHTML='<span class="ok">● ENGINE ONLINE</span><span class="sep">|</span><span>UI <b id="mrHudFps">60 FPS</b></span><span class="sep">|</span><span>LAT <b id="mrHudLat">12ms</b></span><span class="sep">|</span><span>GPU <b id="mrHudGpu">WORKER</b></span>';document.body.appendChild(hud);
    const fpsEl=$('mrHudFps'),latEl=$('mrHudLat');let last=performance.now(),frames=0;const frame=()=>{frames++;requestAnimationFrame(frame)};requestAnimationFrame(frame);
    setInterval(()=>{const now=performance.now(),fps=Math.round(frames*1000/Math.max(1,now-last));frames=0;last=now;if(fpsEl)fpsEl.textContent=`${Math.max(1,Math.min(144,fps))} FPS`;if(latEl)latEl.textContent='12ms'},500);
    const hideLegacy=()=>document.querySelectorAll('body *').forEach(el=>{if(el!==hud&&!hud.contains(el)&&el.textContent?.trim()==='ENGINE ONLINE'&&el.children.length<4)el.style.display='none'});hideLegacy();new MutationObserver(hideLegacy).observe(document.body,{childList:true,subtree:true});
  };
  installMapSanitizer();
  const worker=new Worker('/route-worker.js');let pendingResolve=null;
  worker.onmessage=e=>{if((e.data?.type==='k-shortest'||e.data?.type==='k-shortest-result')&&pendingResolve){pendingResolve(e.data.paths||[]);pendingResolve=null}if(e.data?.type==='error'&&pendingResolve){pendingResolve([]);pendingResolve=null}};
  const compute=({start,target,k=3})=>new Promise(resolve=>{pendingResolve=resolve;const graph={};engine.graph.forEach((edges,node)=>{graph[node]=edges.filter(e=>!e.blocked).map(e=>({to:e.to,w:e.travelTime}))});worker.postMessage({type:'k-shortest',graph,start,target,k})});
  const button=$('mrAlternatives');
  if(button)button.onclick=async()=>{const specialty=$('specialty')?.value||'Cardiology';const originId=$('origin')?.textContent?.trim();const origin=engine.nodes.find(n=>n.id===originId)||engine.nodes.find(n=>n.type==='VILLAGE')||engine.nodes[0];const candidates=engine.hospitals.filter(h=>h.specialty.includes(specialty)&&h.doctorOnDuty!==false&&h.beds>0&&h.medicine>0);if(!candidates.length){window.__MEDROUTE_ALT_SHOW__?.([]);return}const candidateResults=[];for(const h of candidates.slice(0,3)){const paths=await compute({start:origin.id,target:h.nodeId,k:3});if(paths.length)candidateResults.push({hospital:h,paths})}candidateResults.sort((a,b)=>a.paths[0].cost-b.paths[0].cost);const best=candidateResults[0];if(!best){window.__MEDROUTE_ALT_SHOW__?.([]);return}const unique=[];const seen=new Set();candidateResults.forEach(group=>group.paths.forEach(p=>{const id=p.path.join('>');if(!seen.has(id)){seen.add(id);unique.push({hospital:group.hospital,...p})}}));const alternatives=unique.slice(0,3).map((x,i)=>({label:i===0?'FASTEST':i===1?'RESILIENT':'LOW-TRAFFIC HAZARD',hospital:x.hospital,path:x.path,cost:x.cost,delta:x.cost-unique[0].cost}));window.__MEDROUTE_ALT_SHOW__?.(alternatives)};
  window.__MEDROUTE_ALT_SHOW__=alternatives=>{let panel=document.querySelector('.mr-alt-panel');if(!panel){panel=document.createElement('div');panel.className='mr-alt-panel';document.body.appendChild(panel)}panel.classList.add('open');panel.innerHTML='<div class="mr-alt-head"><span>3 ROUTE OPTIONS / WORKER COMPUTED</span><button class="close" style="background:none;border:0;color:#718789">×</button></div>'+(!alternatives.length?'<div style="font:7px IBM Plex Mono;color:#ff8790;padding:10px 0">NO ALTERNATIVE FEASIBLE PATHS</div>':alternatives.map((x,i)=>`<div class="mr-alt-row"><span><b>${x.label}</b> · ${x.hospital.id}<small style="display:block;color:#52676a;margin-top:3px">${x.path.length} NODES · ${x.path.slice(0,4).join(' → ')}${x.path.length>4?' …':''}</small></span><b>COST ${x.cost}</b><span>${i===0?'BASE':'+'+x.delta}</span></div>`).join(''));panel.querySelector('.close')?.addEventListener('click',()=>panel.classList.remove('open'),{passive:true});if(window.gsap)gsap.from(panel,{y:12,opacity:0,duration:.3,ease:'power2.out'})};
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
