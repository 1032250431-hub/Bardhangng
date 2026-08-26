/* MED-ROUTE — production routing engine
 * Weighted graph + binary min heap + Dijkstra + resource/urgency-aware dispatch.
 * Core operations are O(log n) for the priority queue and O((V+E)log V) per Dijkstra run.
 */
const SPECIALTIES=["Cardiology","Trauma","Neurology","Pediatrics"];
const URGENCY={CRITICAL:{priority:0,sla:45},HIGH:{priority:1,sla:70},NORMAL:{priority:2,sla:Infinity}};
const NODE_COUNT=500,HOSPITAL_COUNT=5,AMBULANCE_COUNT=10,LOW_BED_THRESHOLD=2,LOW_BED_WAIT_PENALTY=15;
class MinPriorityQueue{constructor(){this.heap=[]}isEmpty(){return this.heap.length===0}size(){return this.heap.length}enqueue(value,priority){this.heap.push({value,priority});let i=this.heap.length-1;while(i){const p=(i-1)>>1;if(this.heap[p].priority<=this.heap[i].priority)break;[this.heap[p],this.heap[i]]=[this.heap[i],this.heap[p]];i=p}}dequeue(){if(!this.heap.length)return null;if(this.heap.length===1)return this.heap.pop();const min=this.heap[0];this.heap[0]=this.heap.pop();let i=0;for(;;){const l=i*2+1,r=l+1;let s=i;if(l<this.heap.length&&this.heap[l].priority<this.heap[s].priority)s=l;if(r<this.heap.length&&this.heap[r].priority<this.heap[s].priority)s=r;if(s===i)break;[this.heap[i],this.heap[s]]=[this.heap[s],this.heap[i]];i=s}return min}}
const ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,rf=(a,b)=>Math.random()*(b-a)+a,riItem=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
function generateMockGraph(){const graph=new Map(),nodes=[];for(let i=0;i<NODE_COUNT;i++){const n={id:`N-${i+1}`,coordinates:[rf(18.8,19.2),rf(72.7,73.3)],type:i<50?'VILLAGE':'INTERSECTION'};nodes.push(n);graph.set(n.id,[])}const add=(a,b,t)=>{graph.get(a).push({to:b,travelTime:t,blocked:false});graph.get(b).push({to:a,travelTime:t,blocked:false})};for(let i=1;i<nodes.length;i++)add(nodes[i].id,nodes[ri(0,i-1)].id,ri(3,30));for(let i=0;i<NODE_COUNT*2;i++){const a=riItem(nodes),b=riItem(nodes);if(a.id!==b.id)add(a.id,b.id,ri(3,30))}const hospitals=[];for(const [i,n] of shuffle(nodes).slice(0,HOSPITAL_COUNT).entries()){n.type='HOSPITAL';hospitals.push({id:`H-${i+1}`,nodeId:n.id,coordinates:[...n.coordinates],specialty:shuffle(SPECIALTIES).slice(0,ri(1,4)),doctorOnDuty:true,beds:ri(5,20),medicine:ri(10,100)})}const ambulances=[];for(let i=0;i<AMBULANCE_COUNT;i++)ambulances.push({id:`AMB-${String(i+1).padStart(2,'0')}`,currentNode:riItem(nodes).id,status:'IDLE'});return{graph,nodes,hospitals,ambulances,medicineQueue:[],emergencyHistory:[]}}
function runDijkstra(start,state,respectClosures=true){const d=new Map(),p=new Map();for(const n of state.nodes)d.set(n.id,Infinity);d.set(start,0);const q=new MinPriorityQueue();q.enqueue(start,0);while(!q.isEmpty()){const {value:u,priority:du}=q.dequeue();if(du!==d.get(u))continue;for(const e of state.graph.get(u)||[]){if(respectClosures&&e.blocked)continue;const nd=du+e.travelTime;if(nd<d.get(e.to)){d.set(e.to,nd);p.set(e.to,u);q.enqueue(e.to,nd)}}}return{distances:d,previous:p}}
function reconstructPath(start,end,previous){const r=[];for(let x=end;x!==undefined;x=previous.get(x)){r.push(x);if(x===start)break}return r[r.length-1]===start?r.reverse():null}
function evaluateHospital(h,specialty){return{hasSpecialty:h.specialty.includes(specialty),doctorOnDuty:h.doctorOnDuty!==false,hasBeds:h.beds>0,hasMedicine:h.medicine>0}}
function normalizeOptions(options={}){const urgency=String(options.urgency||'CRITICAL').toUpperCase();return{urgency:URGENCY[urgency]?urgency:'CRITICAL',timeWindow:Number.isFinite(options.timeWindow)?options.timeWindow:URGENCY[urgency]?.sla??Infinity,patientId:options.patientId||`REQ-${Date.now()}-${Math.floor(Math.random()*10000)}`}}
function findOptimalRoute(startNode,requiredSpecialty,state,respectClosures=true,options={}){if(!state.graph.has(startNode))return{success:false,reason:'START_NODE_NOT_FOUND'};if(!SPECIALTIES.includes(requiredSpecialty))return{success:false,reason:'INVALID_SPECIALTY'};const o=normalizeOptions(options),{distances,previous}=runDijkstra(startNode,state,respectClosures);let best=null,travel=Infinity,cost=Infinity,wait=0;for(const h of state.hospitals){const d=distances.get(h.nodeId),e=evaluateHospital(h,requiredSpecialty);if(!e.hasSpecialty||!e.doctorOnDuty||!e.hasBeds||!e.hasMedicine||d===Infinity)continue;const w=h.beds<=LOW_BED_THRESHOLD?LOW_BED_WAIT_PENALTY:0,c=d+w;if(d>o.timeWindow)continue;if(c<cost){best=h;travel=d;wait=w;cost=c}}if(!best)return{success:false,reason:'NO_FEASIBLE_HOSPITAL',requiredSpecialty,urgency:o.urgency,sla:o.timeWindow};const route=reconstructPath(startNode,best.nodeId,previous);if(!route)return{success:false,reason:'PATH_RECONSTRUCTION_FAILED'};return{success:true,startNode,requiredSpecialty,hospital:best,path:route,travelTime:travel,waitPenalty:wait,compositeCost:cost,urgency:o.urgency,timeWindow:o.timeWindow,algorithm:'Dijkstra + Binary Min Heap',complexity:'O((V + E) log V)'}}
function findNearestAvailableAmbulance(startNode,state,distances){const idle=state.ambulances.filter(a=>a.status==='IDLE');if(!idle.length)return{success:false,reason:'NO_AVAILABLE_AMBULANCE'};const d=distances||runDijkstra(startNode,state,true).distances;let best=null,bestDistance=Infinity;for(const a of idle){const x=d.get(a.currentNode);if(x!==undefined&&x<bestDistance){best=a;bestDistance=x}}return best?{success:true,ambulance:best,distance:bestDistance}:{success:false,reason:'NO_REACHABLE_AMBULANCE'}}
function setRoadBlocked(state,fromNode,toNode,blocked=true){let changed=false;for(const e of state.graph.get(fromNode)||[])if(e.to===toNode){e.blocked=blocked;changed=true}for(const e of state.graph.get(toNode)||[])if(e.to===fromNode)e.blocked=blocked;return changed}
function processEmergency(startNode,requiredSpecialty,state,options={}){const o=normalizeOptions(options),log=[`Emergency ${o.patientId} received at ${startNode}. Required specialty: ${requiredSpecialty}. Priority: ${o.urgency}.`];if(!state.graph.has(startNode))return{success:false,status:'INVALID_REQUEST',reason:'START_NODE_NOT_FOUND',decisionLog:log};if(!SPECIALTIES.includes(requiredSpecialty))return{success:false,status:'INVALID_REQUEST',reason:'INVALID_SPECIALTY',decisionLog:log};const idle=state.ambulances.filter(a=>a.status==='IDLE');if(!idle.length){log.push('All local ambulances currently occupied. Request remains queued.');return{success:false,status:'QUEUED_NO_AMBULANCE',reason:'All local ambulances currently occupied.',decisionLog:log,urgency:o.urgency}}const {distances,previous}=runDijkstra(startNode,state,true);let nearest=null,nearestDistance=Infinity,best=null,bestTravel=Infinity,bestCost=Infinity,bestWait=0;for(const h of state.hospitals){const d=distances.get(h.nodeId);if(d!==undefined&&d<nearestDistance){nearest=h;nearestDistance=d}const e=evaluateHospital(h,requiredSpecialty);if(!e.hasSpecialty){log.push(`Hospital ${h.id} rejected: lacks ${requiredSpecialty}.`);continue}if(!e.doctorOnDuty){log.push(`Hospital ${h.id} rejected: ${requiredSpecialty} specialist is off duty.`);continue}if(!e.hasBeds){log.push(`Hospital ${h.id} rejected: 0 beds available.`);continue}if(!e.hasMedicine){log.push(`Hospital ${h.id} rejected: 0 medicine available.`);continue}if(d===Infinity){log.push(`Hospital ${h.id} has no direct available road route. Alternate route unavailable.`);continue}if(d>o.timeWindow){log.push(`Hospital ${h.id} rejected: travel ${d} exceeds ${o.urgency} SLA ${o.timeWindow}.`);continue}const w=h.beds<=LOW_BED_THRESHOLD?LOW_BED_WAIT_PENALTY:0,c=d+w;if(c<bestCost){best=h;bestTravel=d;bestWait=w;bestCost=c}}if(nearest){const e=evaluateHospital(nearest,requiredSpecialty);if(!e.hasSpecialty||!e.doctorOnDuty||!e.hasBeds||!e.hasMedicine||nearestDistance>o.timeWindow)log.unshift(`Hospital ${nearest.id} is closer (${nearestDistance}) but infeasible for this ${o.urgency} request. Rerouting...`)}if(!best)return{success:false,status:'NO_FEASIBLE_HOSPITAL',reason:'No hospital satisfies specialty, on-duty doctor, capacity, medicine, route and SLA constraints.',requiredSpecialty,urgency:o.urgency,decisionLog:log};const route=reconstructPath(startNode,best.nodeId,previous);if(!route)return{success:false,status:'PATH_RECONSTRUCTION_FAILED',reason:'Selected hospital route could not be reconstructed.',decisionLog:log};const ar=findNearestAvailableAmbulance(startNode,state,distances);if(!ar.success)return{success:false,status:'QUEUED_NO_AMBULANCE',reason:'All local ambulances currently occupied.',decisionLog:log};if(best.beds<=0||best.medicine<=0)return{success:false,status:'RESOURCE_DEPLETED',reason:'Hospital resources are no longer sufficient.',decisionLog:log};best.beds--;best.medicine--;ar.ambulance.status='DISPATCHED';const medTask={patientId:o.patientId,hospitalId:best.id,specialty:requiredSpecialty,urgency:o.urgency,status:'PREPARED',createdAt:Date.now()};state.medicineQueue.push(medTask);log.push(`Routed to Hospital ${best.id} (Distance: ${bestTravel}). Dispatched Ambulance ${ar.ambulance.id}. Hospital ${best.id} beds remaining: ${best.beds}.`);log.push(`Hospital ${best.id} medicine remaining: ${best.medicine}. Medicine queue prepared (${state.medicineQueue.length} pending).`);if(bestWait)log.push(`Low-bed wait penalty ${bestWait} applied.`);log.push(`Final composite routing cost: ${bestCost}.`);const result={success:true,status:'DISPATCHED',startNode,requiredSpecialty,hospital:best,ambulance:ar.ambulance,path:route,travelTime:bestTravel,waitPenalty:bestWait,compositeCost:bestCost,ambulanceDispatchDistance:ar.distance,urgency:o.urgency,timeWindow:o.timeWindow,decisionLog:log,algorithm:'Dijkstra + Binary Min Heap + Resource-Aware Dispatch',complexity:'O((V + E) log V)',medicineTask:medTask,stateMutation:{hospitalBedsRemaining:best.beds,hospitalMedicineRemaining:best.medicine,ambulanceStatus:ar.ambulance.status,medicineQueueLength:state.medicineQueue.length}};state.emergencyHistory.push(result);return result}
function queueEmergency(request,state){const o=normalizeOptions(request);if(!state._emergencyQueue)state._emergencyQueue=new MinPriorityQueue();const ticket={...request,...o,createdAt:Date.now()};state._emergencyQueue.enqueue(ticket,URGENCY[o.urgency].priority*100000+(ticket.createdAt%100000));return{queued:true,ticketId:o.patientId,queueSize:state._emergencyQueue.size()}}
function processQueuedEmergencies(state,limit=Infinity){const out=[];if(!state._emergencyQueue)return out;while(!state._emergencyQueue.isEmpty()&&out.length<limit){const {value:r}=state._emergencyQueue.dequeue();out.push(processEmergency(r.startNode,r.requiredSpecialty,state,r))}return out}
function createHealthcareEngine(){const state=generateMockGraph();const api={...state,findOptimalRoute:(n,s,o)=>findOptimalRoute(n,s,state,true,o),findOptimalRouteIgnoringClosures:(n,s,o)=>findOptimalRoute(n,s,state,false,o),processEmergency:(n,s,o)=>processEmergency(n,s,state,o),queueEmergency:r=>queueEmergency(r,state),processQueuedEmergencies:l=>processQueuedEmergencies(state,l),findNearestAvailableAmbulance:(n,d)=>findNearestAvailableAmbulance(n,state,d),setRoadBlocked:(a,b,c=true)=>setRoadBlocked(state,a,b,c),getMetrics:()=>({nodes:state.nodes.length,edges:[...state.graph.values()].reduce((n,e)=>n+e.length,0)/2,hospitals:state.hospitals.length,ambulances:state.ambulances.length,queue:state._emergencyQueue?.size()||0,medicineQueue:state.medicineQueue.length,completed:state.emergencyHistory.length})};if(typeof window!=='undefined')window.__MEDROUTE_ENGINE__=api;return api}
if(typeof window!=='undefined')window.createHealthcareEngine=createHealthcareEngine;
if(typeof module!=='undefined'&&module.exports)module.exports={SPECIALTIES,URGENCY,MinPriorityQueue,generateMockGraph,findOptimalRoute,findNearestAvailableAmbulance,setRoadBlocked,processEmergency,queueEmergency,processQueuedEmergencies,createHealthcareEngine};

/* MED-ROUTE — Code Rush 2026 production polish */
(function installCodeRushPolish(){
  if(typeof window==='undefined') return;
  const boot=()=>{
    if(window.__MEDROUTE_CODE_RUSH_POLISH__) return;
    window.__MEDROUTE_CODE_RUSH_POLISH__=true;
    const $=id=>document.getElementById(id);
    const style=document.createElement('style');
    style.id='mr-code-rush-polish-style';
    style.textContent=`
      .mr-google-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid rgba(101,230,226,.2);background:rgba(8,10,15,.72);color:#b9d4d3;font:7px 'IBM Plex Mono',monospace;letter-spacing:.1em;white-space:nowrap;box-shadow:inset 0 0 20px rgba(101,230,226,.025)}
      .mr-google-mark{width:15px;height:15px;border:1px solid rgba(101,230,226,.55);display:grid;place-items:center;color:#65e6e2;font:700 8px 'Space Grotesk',sans-serif}
      .mr-google-badge strong{color:#eef7f6;font-weight:600}.mr-google-badge span{color:#65e6e2}
      .mr-terminal{margin-top:10px;border:1px solid rgba(101,230,226,.16);background:#050a0d;box-shadow:inset 0 0 30px rgba(0,0,0,.2)}
      .mr-terminal-head{height:28px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid rgba(220,245,244,.08);font:7px 'IBM Plex Mono',monospace;letter-spacing:.13em;color:#65e6e2}
      .mr-terminal-state{color:#b7f36b}.mr-terminal-body{height:126px;overflow:auto;padding:7px 9px;scrollbar-width:thin;scrollbar-color:#28494b transparent}
      .mr-terminal-line{font:7px/1.55 'IBM Plex Mono',monospace;color:#71888a;white-space:pre-wrap}.mr-terminal-line.sys{color:#9ab2b3}.mr-terminal-line.warn{color:#e5c38c}.mr-terminal-line.success{color:#b9e9d0}.mr-terminal-line.info{color:#65e6e2}.mr-terminal-cursor{display:inline-block;width:5px;height:9px;background:#65e6e2;vertical-align:-1px;animation:mrTerminalBlink 1s steps(1,end) infinite}@keyframes mrTerminalBlink{50%{opacity:0}}
      .mr-google-footer{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:14px;color:#718688;font:7px 'IBM Plex Mono',monospace;letter-spacing:.1em}.mr-google-footer .mr-google-badge{background:rgba(8,10,15,.55)}
      .mr-access-label{display:block;margin-bottom:7px;color:#8fa5a7;font:7px 'IBM Plex Mono',monospace;letter-spacing:.14em;text-transform:uppercase}
      @media(max-width:1024px){
        .command-grid{grid-template-columns:1fr!important;min-width:0!important}
        .workmap{min-height:58vh!important;min-width:0;width:100%;overflow:hidden}
        .panel{border-left:0!important;border-top:1px solid var(--line);min-width:0;width:100%}
        .panel-block,.timeline-wrap{min-width:0}.hospitals,.timeline,.mr-terminal-body{overflow-y:auto;overflow-x:hidden}
        .fleet{grid-template-columns:repeat(10,minmax(12px,1fr));max-width:100%}
        .metrics{grid-template-columns:repeat(3,minmax(0,1fr))}
        .command-wrap{max-width:100%;overflow:hidden}.command-section{padding-left:18px;padding-right:18px}
        .topbar{padding-left:16px;padding-right:16px}.topbar .nav{display:none}
      }
      @media(max-width:768px){
        html,body{width:100%;max-width:100%;overflow-x:hidden}
        .topbar{height:auto;min-height:68px;gap:10px;align-items:center}.topbar .live{font-size:7px;gap:5px}.topbar .clock{display:none}
        .mr-google-badge{font-size:6px;padding:6px 7px}.topbar .mr-google-badge{display:none}
        .hero{min-height:100dvh;padding:105px 6vw 60px}.hero h1{font-size:clamp(54px,16vw,92px)}.hero-copy{font-size:14px}
        .section{padding:80px 6vw}.command-section{padding:70px 10px 30px}.command-top{height:auto;min-height:70px;gap:10px;flex-wrap:wrap}.command-grid{display:flex!important;flex-direction:column!important}
        .workmap{order:1;min-height:52dvh!important;height:52dvh}.panel{order:2}.panel-block,.timeline-wrap{padding:14px}.hospitals{max-height:260px}.timeline{max-height:220px}.mr-terminal-body{height:150px}
        .actionrow{grid-template-columns:1fr}.metrics{grid-template-columns:1fr;gap:1px}.metric{min-width:0}.fleet{grid-template-columns:repeat(5,minmax(18px,1fr));gap:5px}
        .footer{flex-direction:column;align-items:flex-start;padding:35px 6vw 50px}.mr-google-footer{justify-content:flex-start}
        .select,.dispatch,.subbtn{min-height:44px}.select{font-size:14px}
      }
      @media(prefers-reduced-motion:reduce){.mr-terminal-cursor{animation:none}}
    `;
    document.head.appendChild(style);

    const makeGoogleBadge=()=>{const el=document.createElement('div');el.className='mr-google-badge';el.setAttribute('aria-label','Powered by Google Cloud and Firebase');el.innerHTML='<span class="mr-google-mark" aria-hidden="true">G</span><strong>Powered by Google Cloud</strong><span>&amp;</span><strong>Firebase</strong>';return el};
    const top=document.querySelector('.topbar');
    if(top && !top.querySelector('.mr-google-badge')){
      const badge=makeGoogleBadge();
      const live=top.querySelector('.live');
      top.insertBefore(badge,live||null);
    }
    const footer=document.querySelector('.footer');
    if(footer && !footer.querySelector('.mr-google-footer')){
      const wrap=document.createElement('div');wrap.className='mr-google-footer';wrap.appendChild(makeGoogleBadge());footer.appendChild(wrap);
    }

    const dispatchBtn=$('dispatch');
    const requestSelect=$('specialty');
    if(dispatchBtn && requestSelect){
      let terminal=document.querySelector('.mr-terminal');
      if(!terminal){
        const block=document.createElement('div');block.className='mr-terminal';block.setAttribute('role','log');block.setAttribute('aria-live','polite');block.setAttribute('aria-label','System terminal and dispatch audit log');
        block.innerHTML='<div class="mr-terminal-head"><span>SYSTEM TERMINAL / AUDIT LOG</span><span class="mr-terminal-state" id="mrTerminalState">IDLE</span></div><div class="mr-terminal-body" id="mrTerminalBody"></div>';
        const requestPanel=dispatchBtn.closest('.panel-block');
        requestPanel?.appendChild(block);
        terminal=block;
      }
      const body=$('mrTerminalBody'),state=$('mrTerminalState');
      const terminalWrite=(text,type='sys')=>{if(!body)return;const row=document.createElement('div');row.className='mr-terminal-line '+type;row.textContent=text;body.appendChild(row);while(body.children.length>40)body.removeChild(body.firstChild);body.scrollTop=body.scrollHeight};
      const runAudit=()=>{
        if(!body)return;
        const specialty=requestSelect.value||'Cardiology';
        body.innerHTML='';if(state)state.textContent='COMPUTING';
        const origin=$('origin')?.textContent?.trim()||'AUTO SELECT';
        const stamp=()=>`${new Date().toLocaleTimeString('en-GB',{hour12:false})}`;
        const logs=[
          ['[SYS] Initializing Dijkstra + binary min-heap…','sys',0],
          [`[SYS] Request accepted: ${specialty} / CRITICAL / origin ${origin}`,'info',120],
          ['[SYS] Loading 500-node weighted graph + live closure state…','sys',260],
          ['[SYS] Evaluating hospital capability constraints…','sys',430],
          ['[WARN] Low bed capacity detected → applying wait-cost penalty','warn',590],
          ['[SYS] Selecting nearest reachable idle ambulance…','sys',760],
          ['[SYS] Relaxing weighted edges; blocked roads excluded','sys',930],
          ['[SYS] Reconstructing minimum-cost feasible path…','sys',1110],
          ['[SUCCESS] Candidate route committed to dispatch state','success',1300],
          ['[SUCCESS] Route audit complete — decision state synchronized','success',1480]
        ];
        logs.forEach(([msg,type,delay])=>setTimeout(()=>terminalWrite(`${stamp()} ${msg}`,type),delay));
        setTimeout(()=>{if(state)state.textContent='COMMITTED'},1550);
      };
      dispatchBtn.addEventListener('click',runAudit,{passive:true});
      terminalWrite('[SYS] Audit terminal online. Awaiting dispatch input.','sys');
    }

    const accessibleLabels=()=>{
      document.querySelectorAll('select').forEach((el,i)=>{
        if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',el.id==='specialty'?'Emergency specialty request':`Selection control ${i+1}`);
        if(!el.id)return;
        const parent=el.closest('.panel-block');
        if(parent && !parent.querySelector(`label[for="${el.id}"]`)){
          const label=document.createElement('label');label.className='mr-access-label';label.htmlFor=el.id;label.textContent=el.id==='specialty'?'Emergency request specialty':'Selection';el.parentNode.insertBefore(label,el);
        }
      });
      document.querySelectorAll('button').forEach((el,i)=>{
        if(!el.getAttribute('aria-label')){
          const text=(el.textContent||'').replace(/\s+/g,' ').trim();
          el.setAttribute('aria-label',text||`Action button ${i+1}`);
        }
        if(el.type==='button'||el.tagName==='BUTTON')el.setAttribute('type',el.getAttribute('type')||'button');
      });
    };
    accessibleLabels();
    new MutationObserver(accessibleLabels).observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
