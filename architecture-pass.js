(()=>{
'use strict';

const boot=()=>{
  if(window.__MEDROUTE_ARCHITECTURE_PASS__)return;
  window.__MEDROUTE_ARCHITECTURE_PASS__=true;
  const $=id=>document.getElementById(id);
  const qa=sel=>Array.from(document.querySelectorAll(sel));
  const engine=window.__MEDROUTE_ENGINE__;
  if(!engine)return;

  fixHeroTypography();
  installTacticalCanvas();
  installCoordinateTelemetry();
  installAudioCues();
  installCommandPalette();
  installPowerTools();
  installOfflineState();
  installErrorGuard();
};

function fixHeroTypography(){
  const style=document.createElement('style');
  style.id='mr-architecture-style';
  style.textContent=`
    .hero h1{position:relative;z-index:2;text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased;overflow:visible}
    .hero h1 .accent,.hero h1 em{display:inline-block;vertical-align:baseline;transform:none!important;will-change:auto;line-height:.88}
    .hero h1 .accent:after{transform-origin:center;pointer-events:none}
    .mr-command-palette{position:fixed;inset:0;z-index:1200;display:none;align-items:flex-start;justify-content:center;padding:12vh 20px;background:rgba(2,5,7,.72);backdrop-filter:blur(18px)}
    .mr-command-palette.open{display:flex}
    .mr-cmd-box{width:min(760px,100%);border:1px solid rgba(101,230,226,.22);background:rgba(6,14,18,.97);box-shadow:0 40px 120px rgba(0,0,0,.72),0 0 60px rgba(101,230,226,.08);overflow:hidden}
    .mr-cmd-top{display:flex;align-items:center;gap:12px;padding:15px 17px;border-bottom:1px solid rgba(220,245,244,.1)}
    .mr-cmd-top input{flex:1;background:transparent;border:0;outline:0;color:#e9f6f4;font:13px 'IBM Plex Mono';letter-spacing:.03em}
    .mr-cmd-top kbd{font:7px 'IBM Plex Mono';color:#718789;border:1px solid rgba(220,245,244,.12);padding:5px 7px}
    .mr-cmd-results{max-height:55vh;overflow:auto;padding:8px}
    .mr-cmd-item{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 12px;border:1px solid transparent;background:transparent;color:#a8bbbc;text-align:left;font:8px 'IBM Plex Mono';letter-spacing:.05em}
    .mr-cmd-item:hover,.mr-cmd-item.selected{background:rgba(101,230,226,.07);border-color:rgba(101,230,226,.18);color:#65e6e2}
    .mr-cmd-item small{color:#50676a;font-size:6px}
    .mr-powerbar{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
    .mr-power-btn{height:30px;padding:0 9px;border:1px solid rgba(220,245,244,.1);background:rgba(255,255,255,.02);color:#8da4a5;font:7px 'IBM Plex Mono';letter-spacing:.08em}
    .mr-power-btn:hover{border-color:rgba(101,230,226,.35);color:#65e6e2;background:rgba(101,230,226,.04)}
    .mr-canvas-layer{position:absolute;inset:0;z-index:799;pointer-events:none;mix-blend-mode:screen}
    .mr-canvas-layer canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:.82}
    .mr-scan-toggle{position:absolute;right:20px;top:20px;z-index:801;height:26px;padding:0 8px;border:1px solid rgba(220,245,244,.1);background:rgba(5,10,13,.75);color:#6d8385;font:6px 'IBM Plex Mono';letter-spacing:.12em}
    .mr-scan-toggle.on{color:#65e6e2;border-color:rgba(101,230,226,.28)}
    .mr-coords{position:absolute;right:20px;bottom:20px;z-index:801;padding:8px 10px;border:1px solid rgba(220,245,244,.1);background:rgba(5,10,13,.76);backdrop-filter:blur(8px);font:7px 'IBM Plex Mono';color:#708789;letter-spacing:.08em}
    .mr-coords b{color:#c5ddda;font-weight:500}
    .mr-triage{margin-top:10px;padding:10px;border:1px solid rgba(220,245,244,.08);background:rgba(255,255,255,.018)}
    .mr-triage-head{display:flex;justify-content:space-between;font:7px 'IBM Plex Mono';letter-spacing:.1em;color:#65e6e2}
    .mr-rank{display:grid;grid-template-columns:32px 48px 1fr 48px;gap:7px;align-items:center;padding:6px 0;border-top:1px solid rgba(220,245,244,.05);font:6.5px 'IBM Plex Mono';color:#809597}
    .mr-rank b{color:#d5e5e3}.mr-score{color:#b7f36b;text-align:right}
    .mr-alt-panel{position:fixed;right:20px;bottom:20px;z-index:850;width:min(390px,calc(100vw - 40px));padding:12px;border:1px solid rgba(101,230,226,.18);background:rgba(5,12,16,.92);backdrop-filter:blur(16px);display:none;box-shadow:0 20px 70px rgba(0,0,0,.55)}
    .mr-alt-panel.open{display:block}.mr-alt-head{display:flex;justify-content:space-between;margin-bottom:7px;font:7px 'IBM Plex Mono';color:#65e6e2;letter-spacing:.14em}
    .mr-alt-row{display:grid;grid-template-columns:1fr 58px 58px;gap:7px;padding:7px 0;border-top:1px solid rgba(220,245,244,.06);font:6.5px 'IBM Plex Mono';color:#829698}.mr-alt-row b{color:#d6e5e3}.mr-alt-row span:last-child{text-align:right;color:#b7f36b}
    .mr-incident-print{display:none}
    body.mr-incident .mapwash{background:radial-gradient(circle at 48% 44%,transparent 0 12%,rgba(70,12,10,.18) 35%,rgba(20,4,4,.88) 100%),linear-gradient(90deg,rgba(16,5,5,.96),rgba(20,6,6,.34) 42%,rgba(12,4,4,.7))}
    body.mr-incident .topbar{box-shadow:inset 0 2px rgba(255,101,113,.5),0 0 45px rgba(255,101,113,.08)}
    body.mr-incident .dispatch{background:#ff6571;box-shadow:0 0 35px rgba(255,101,113,.24)}
    @media(max-width:700px){.mr-command-palette{padding:7vh 10px}.mr-alt-panel{right:10px;bottom:10px;width:calc(100vw - 20px)}.mr-scan-toggle{right:10px;top:10px}.mr-coords{right:10px;bottom:10px}.mr-canvas-layer canvas{opacity:.65}}
    @media print{body>*:not(.mr-incident-print){display:none!important}.mr-incident-print{display:block!important;color:#111;background:#fff;padding:28px;font:12px Arial}.mr-incident-print h1{font-size:24px}.mr-incident-print pre{white-space:pre-wrap}}
  `;
  document.head.appendChild(style);
}

function installTacticalCanvas(){
  const maps=[document.getElementById('workmap'),document.getElementById('map')].filter(Boolean);
  maps.forEach((mapEl,index)=>{
    if(mapEl.querySelector('.mr-canvas-layer'))return;
    const layer=document.createElement('div');layer.className='mr-canvas-layer';
    const canvas=document.createElement('canvas');layer.appendChild(canvas);mapEl.appendChild(layer);
    const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
    let w=0,h=0,dpr=1,scan=true,raf=0;
    const resize=()=>{const r=mapEl.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);w=Math.max(1,Math.floor(r.width));h=Math.max(1,Math.floor(r.height));canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};
    const draw=t=>{raf=requestAnimationFrame(draw);if(!scan)return;ctx.clearRect(0,0,w,h);const y=((t*.045)% (h+100))-50;const g=ctx.createLinearGradient(0,y-35,0,y+35);g.addColorStop(0,'rgba(101,230,226,0)');g.addColorStop(.5,'rgba(101,230,226,.11)');g.addColorStop(1,'rgba(101,230,226,0)');ctx.fillStyle=g;ctx.fillRect(0,y-35,w,70);ctx.strokeStyle='rgba(101,230,226,.055)';ctx.lineWidth=1;const gap=38;for(let x=0;x<w;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y2=0;y2<h;y2+=gap){ctx.beginPath();ctx.moveTo(0,y2);ctx.lineTo(w,y2);ctx.stroke()}ctx.strokeStyle='rgba(255,255,255,.035)';for(let i=0;i<24;i++){const x=(i*83+(t*.012))%w;const yy=(i*47)%h;ctx.fillRect(x,yy,1,1)}};
    const toggle=document.createElement('button');toggle.className='mr-scan-toggle on';toggle.textContent='SCAN // ON';toggle.onclick=()=>{scan=!scan;toggle.classList.toggle('on',scan);toggle.textContent=scan?'SCAN // ON':'SCAN // OFF'};layer.appendChild(toggle);
    const coords=document.createElement('div');coords.className='mr-coords';coords.innerHTML='LAT <b>--</b> · LNG <b>--</b> · Z <b>--</b>';layer.appendChild(coords);
    const updateCoords=()=>{const map=index===0?window.workmap:window.map;if(!map)return;const c=map.getCenter();const bs=coords.querySelectorAll('b');bs[0].textContent=c.lat.toFixed(4);bs[1].textContent=c.lng.toFixed(4);bs[2].textContent=map.getZoom().toFixed(0)};
    resize();updateCoords();window.addEventListener('resize',resize,{passive:true});const map=index===0?window.workmap:window.map;if(map)map.on('move zoom',updateCoords);requestAnimationFrame(draw);
  });
}

function installCoordinateTelemetry(){
  const map=window.workmap||window.map;if(!map)return;
  const tick=()=>{const c=map.getCenter();const nodes=document.querySelectorAll('.mr-coords b');if(nodes.length){nodes[0].textContent=c.lat.toFixed(4);nodes[1].textContent=c.lng.toFixed(4);nodes[2].textContent=map.getZoom().toFixed(0)}};
  map.on('move zoom',tick);tick();
}

function installAudioCues(){
  let audio=null;
  const getAudio=()=>{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio};
  const tone=(freq,duration=.045,volume=.018,type='sine')=>{try{const a=getAudio(),o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+duration);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+duration)}catch(_){}}
  window.__MEDROUTE_AUDIO__={click:()=>tone(920,.035,.012,'square'),press:()=>tone(520,.06,.018,'triangle'),critical:()=>{tone(220,.11,.028,'sawtooth');setTimeout(()=>tone(165,.14,.022,'sawtooth'),115)}};
  document.addEventListener('pointerover',e=>{if(e.target.closest('button,.tool,.hospital'))window.__MEDROUTE_AUDIO__.click()},{passive:true});
  document.addEventListener('pointerdown',e=>{if(e.target.closest('button,.tool,.hospital'))window.__MEDROUTE_AUDIO__.press()},{passive:true});
}

function installCommandPalette(){
  const overlay=document.createElement('div');overlay.className='mr-command-palette';overlay.id='mrCommandPalette';overlay.innerHTML='<div class="mr-cmd-box"><div class="mr-cmd-top"><span style="color:#65e6e2">⌘</span><input id="mrCmdInput" autocomplete="off" placeholder="Search hospitals, actions, incidents…"><kbd>ESC</kbd></div><div class="mr-cmd-results" id="mrCmdResults"></div></div>';
  document.body.appendChild(overlay);const input=overlay.querySelector('#mrCmdInput'),results=overlay.querySelector('#mrCmdResults');
  const actions=[
    ['AUTHORIZE DISPATCH','Run the existing emergency dispatch engine.','dispatch'],['RESET FLEET','Return all ambulances to IDLE.','reset'],['CLEAR DECISION LOG','Clear visible timeline entries.','clear'],['ROAD CLOSURE','Inject or clear the existing closure scenario.','closure'],['EXPORT JSON','Download the current incident telemetry.','json'],['PRINT / PDF','Open a print-ready incident report.','pdf'],['TRIAGE RANKING','Rank hospitals for the current specialty.','triage'],['ALTERNATIVE ROUTES','Show fastest / resilient / resource-aware alternatives.','alternatives']
  ];
  const render=q=>{results.innerHTML='';const list=[...actions.map(a=>({name:a[0],desc:a[1],kind:'ACTION',run:()=>runAction(a[2])})),...engine.hospitals.map(h=>({name:h.id+' · '+h.specialty.join(' / '),desc:`${h.beds} beds · ${h.medicine} medicine · ${h.doctorOnDuty?'SPECIALIST ON DUTY':'OFF DUTY'}`,kind:'HOSPITAL',run:()=>focusHospital(h)}))].filter(x=>(x.name+' '+x.desc).toLowerCase().includes(q.toLowerCase()));list.slice(0,18).forEach((x,i)=>{const b=document.createElement('button');b.className='mr-cmd-item'+(i===0?' selected':'');b.innerHTML=`<span>${x.name}</span><small>${x.kind} · ${x.desc}</small>`;b.onclick=()=>{x.run();overlay.classList.remove('open')};results.appendChild(b)})};
  const open=()=>{overlay.classList.add('open');input.value='';render('');setTimeout(()=>input.focus(),0)};const close=()=>overlay.classList.remove('open');
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open()}else if(e.key==='Escape')close()});input.addEventListener('input',()=>render(input.value));overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  const btn=document.createElement('button');btn.className='mr-power-btn';btn.textContent='⌘ COMMAND';btn.onclick=open;const target=document.querySelector('.command-top')||document.querySelector('.command-title');if(target)target.appendChild(btn);
  function runAction(kind){if(kind==='dispatch')document.querySelector('#dispatch')?.click();if(kind==='reset')document.querySelector('#resetFleet')?.click();if(kind==='clear')document.querySelector('#clear')?.click();if(kind==='closure')document.querySelector('#closure')?.click();if(kind==='json')exportJSON();if(kind==='pdf')printIncident();if(kind==='triage')showTriage();if(kind==='alternatives')showAlternatives()}
  function focusHospital(h){const map=window.workmap;if(map){map.setView(h.coordinates,12,{animate:true});const el=document.querySelector(`.hospital[data-id="${h.id}"]`);el?.scrollIntoView({block:'nearest'});el?.classList.add('active');setTimeout(()=>el?.classList.remove('active'),1300)}}
}

function installPowerTools(){
  const panel=document.querySelector('.panel');if(!panel||document.querySelector('.mr-powerbar'))return;
  const bar=document.createElement('div');bar.className='mr-powerbar';bar.innerHTML='<button class="mr-power-btn" id="mrTriage">TRIAGE RANK</button><button class="mr-power-btn" id="mrAlternatives">3 ROUTES</button><button class="mr-power-btn" id="mrJSON">EXPORT JSON</button><button class="mr-power-btn" id="mrPDF">REPORT / PDF</button>';panel.appendChild(bar);
  $('mrTriage').onclick=showTriage;$('mrAlternatives').onclick=showAlternatives;$('mrJSON').onclick=exportJSON;$('mrPDF').onclick=printIncident;
}

function currentRequest(){const specialty=document.getElementById('specialty')?.value||'Cardiology';const urgency=document.getElementById('urgency')?.value||'CRITICAL';const h=engine.hospitals.find(x=>x.specialty.includes(specialty)&&x.beds>0&&x.medicine>0)||engine.hospitals[0];const originId=document.getElementById('origin')?.textContent?.trim();const origin=engine.nodes.find(n=>n.id===originId)||engine.nodes.find(n=>n.type==='VILLAGE')||engine.nodes[0];return{specialty,urgency,origin}}

function triageScore(h,request){const d=Math.abs(h.coordinates[0]-request.origin.coordinates[0])+Math.abs(h.coordinates[1]-request.origin.coordinates[1]);const specialty=h.specialty.includes(request.specialty)?1:0;const doctor=h.doctorOnDuty!==false?1:0;const beds=Math.min(1,h.beds/10);const med=Math.min(1,h.medicine/50);return Math.max(0,Math.round((specialty*45+doctor*20+beds*20+med*10-Math.min(20,d*80))*100)/100)}

function showTriage(){
  const request=currentRequest();const ranked=[...engine.hospitals].map(h=>({h,score:triageScore(h,request)})).sort((a,b)=>b.score-a.score);let box=document.querySelector('.mr-triage');if(!box){box=document.createElement('div');box.className='mr-triage';document.querySelector('.panel')?.appendChild(box)}box.innerHTML='<div class="mr-triage-head"><span>LIVE PATIENT TRIAGE</span><span>'+request.specialty+' / '+request.urgency+'</span></div>'+ranked.map((x,i)=>`<div class="mr-rank"><b>#${i+1}</b><b>${x.h.id}</b><span>${x.h.specialty.includes(request.specialty)?'SPECIALIST':'NO SPECIALTY'} · ${x.h.beds}B · ${x.h.medicine}M</span><span class="mr-score">${x.score}</span></div>`).join('');if(window.gsap)gsap.from(box,{y:8,opacity:0,duration:.35,ease:'power2.out'})}

function showAlternatives(){
  const request=currentRequest();const ranked=[...engine.hospitals].map(h=>{const dist=Math.abs(h.coordinates[0]-request.origin.coordinates[0])+Math.abs(h.coordinates[1]-request.origin.coordinates[1]);return{h,dist,feasible:h.specialty.includes(request.specialty)&&h.doctorOnDuty&&h.beds>0&&h.medicine>0}}).sort((a,b)=>a.dist-b.dist).slice(0,3);let panel=document.querySelector('.mr-alt-panel');if(!panel){panel=document.createElement('div');panel.className='mr-alt-panel';document.body.appendChild(panel)}panel.classList.add('open');panel.innerHTML='<div class="mr-alt-head"><span>ROUTE ALTERNATIVES</span><button class="close" style="background:none;border:0;color:#718789" aria-label="Close">×</button></div><div class="mr-alt-row"><b>FASTEST</b><b>ETA</b><b>STATUS</b></div>'+ranked.map((x,i)=>`<div class="mr-alt-row"><span>${x.h.id} · ${i===0?'MIN TRAVEL':'ALTERNATE'}</span><b>${Math.max(1,Math.round(x.dist*120))} ms</b><span>${x.feasible?'FEASIBLE':'DIVERT'}</span></div>`).join('');panel.querySelector('.close').onclick=()=>panel.classList.remove('open')}

function exportJSON(){
  const payload={exportedAt:new Date().toISOString(),request:currentRequest(),metrics:engine.getMetrics(),hospitals:engine.hospitals,ambulances:engine.ambulances,medicineQueue:engine.medicineQueue,emergencyHistory:engine.emergencyHistory};download('med-route-incident.json',JSON.stringify(payload,null,2),'application/json');
}

function printIncident(){
  let node=document.querySelector('.mr-incident-print');if(!node){node=document.createElement('article');node.className='mr-incident-print';document.body.appendChild(node)}const data={exportedAt:new Date().toISOString(),metrics:engine.getMetrics(),history:engine.emergencyHistory};node.innerHTML=`<h1>MED-ROUTE / INCIDENT REPORT</h1><p>Generated ${data.exportedAt}</p><p>Completed incidents: ${data.metrics.completed}</p><pre>${JSON.stringify(data.history,null,2)}</pre>`;window.print()}

function download(name,text,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

function installOfflineState(){
  const DB='med-route-runtime',STORE='snapshots';let dbPromise=null;
  const open=()=>dbPromise||(dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}));
  const snapshot=async()=>{try{const db=await open(),tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id:'latest',savedAt:Date.now(),metrics:engine.getMetrics(),hospitals:engine.hospitals,ambulances:engine.ambulances,medicineQueue:engine.medicineQueue});}catch(_){}};
  window.__MEDROUTE_OFFLINE__={snapshot};setInterval(snapshot,5000);snapshot();
  window.addEventListener('online',()=>document.body.classList.remove('mr-offline'));window.addEventListener('offline',()=>document.body.classList.add('mr-offline'));
}

function installErrorGuard(){
  const banner=document.createElement('div');banner.id='mrFault';banner.style.cssText='display:none;position:fixed;left:16px;right:16px;bottom:16px;z-index:1300;padding:11px 14px;border:1px solid rgba(255,101,113,.35);background:rgba(30,7,9,.94);color:#ff9ca4;font:8px IBM Plex Mono;backdrop-filter:blur(12px)';document.body.appendChild(banner);
  window.addEventListener('error',e=>{if(String(e.message||'').includes('ResizeObserver'))return;banner.textContent='SYSTEM FAULT / UI RECOVERY ACTIVE · '+String(e.message||'Unknown client error').slice(0,140);banner.style.display='block';setTimeout(()=>banner.style.display='none',5000)});
  window.addEventListener('unhandledrejection',e=>{banner.textContent='SYSTEM FAULT / ASYNC RECOVERY ACTIVE · '+String(e.reason||'Unhandled async error').slice(0,140);banner.style.display='block';setTimeout(()=>banner.style.display='none',5000)});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
