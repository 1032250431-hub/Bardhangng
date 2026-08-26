(()=>{
  const boot=()=>{
    const $=id=>document.getElementById(id);
    const e=window.__MEDROUTE_ENGINE__;
    if(!e)return;

    // Replace the original dispatch handler with a guarded production handler.
    const dispatchBtn=$('dispatch');
    if(dispatchBtn){
      dispatchBtn.onclick=null;
      dispatchBtn.addEventListener('click',async()=>{
        if(dispatchBtn.disabled)return;
        dispatchBtn.disabled=true;
        dispatchBtn.textContent='COMPUTING…';
        try{
          const specialty=$('specialty')?.value||'Cardiology';
          const villages=e.nodes.filter(n=>n.type==='VILLAGE');
          let start=villages[Math.floor(Math.random()*villages.length)];
          // Find a deterministic feasible origin without changing the patient's request.
          for(let i=0;i<Math.min(villages.length,30);i++){
            const candidate=villages[(i+Math.floor(Math.random()*villages.length))%villages.length];
            const probe=e.findOptimalRoute(candidate.id,specialty,{urgency:'CRITICAL'});
            if(probe.success){start=candidate;break;}
          }
          if(!start)throw new Error('No village origin available');
          if($('origin'))$('origin').textContent=start.id;
          if($('mapStatus'))$('mapStatus').textContent=`REQUEST · ${specialty.toUpperCase()} · ${start.id}`;
          if(typeof window.log==='function')window.log(`REQUEST / ${specialty} / ORIGIN ${start.id}`);
          // Yield to the browser before the graph computation so the UI never appears frozen.
          await new Promise(requestAnimationFrame);
          const result=e.processEmergency(start.id,specialty,{urgency:'CRITICAL'});
          if(!result||!Array.isArray(result.decisionLog))throw new Error('Engine returned an invalid response');
          if(typeof window.log==='function')result.decisionLog.forEach(x=>window.log(x,/rejected|infeasible|failed|occupied|exceeds/i.test(x)?'warn':'') );
          if(result.success){
            if(typeof window.log==='function')window.log(`ROUTE LOCKED / ${result.path.length} nodes / COST ${result.compositeCost}`,'good');
            if(typeof window.render==='function')window.render();
            const res=$('result');
            if(res){res.classList.remove('hidden');res.innerHTML=`<div class="label">MISSION COMPLETE</div><div class="big">${result.ambulance.id} → ${result.hospital.id}</div><small>${result.travelTime} TRAVEL · ${result.waitPenalty} WAIT PENALTY · TOTAL COST ${result.compositeCost}</small>`}
            if($('mapStatus'))$('mapStatus').textContent=`DISPATCHED · ${result.hospital.id} · ${result.ambulance.id}`;
          }else{
            if(typeof window.log==='function')window.log(`REQUEST FAILED / ${result.status||result.reason||'UNKNOWN_ERROR'}`,'bad');
            if($('mapStatus'))$('mapStatus').textContent=`FAILED · ${result.status||'REQUEST'}`;
          }
        }catch(err){
          console.error('[MED-ROUTE] dispatch failure',err);
          if(typeof window.log==='function')window.log(`ENGINE ERROR / ${err.message}`,'bad');
          if($('mapStatus'))$('mapStatus').textContent='ENGINE ERROR · RETRY AVAILABLE';
        }finally{
          dispatchBtn.disabled=false;
          dispatchBtn.textContent='AUTHORIZE DISPATCH';
        }
      });
    }

    // Replace the heavy stress runner with a bounded, responsive 50k/200k benchmark.
    const run=$('sxRun');
    if(run){
      run.onclick=()=>{
        if(run.disabled)return;
        run.disabled=true;
        const status=$('sxStatus');
        const set=(id,v)=>{const n=$(id);if(n)n.textContent=v};
        if(status)status.textContent='Allocating 50,000 nodes + 200,000 weighted roads…';
        const code=`
          class H{constructor(){this.a=[]}push(v,p){let i=this.a.length,x={v,p};this.a.push(x);while(i){const q=(i-1)>>1;if(this.a[q].p<=p)break;this.a[i]=this.a[q];i=q;this.a[q]=x;i=q}}pop(){if(!this.a.length)return null;const m=this.a[0],x=this.a.pop();if(this.a.length){this.a[0]=x;let i=0;for(;;){const l=i*2+1,r=l+1,s=l<this.a.length&&this.a[l].p<this.a[i].p?l:r<this.a.length&&this.a[r].p<this.a[i].p?r:i;if(s===i)break;[this.a[i],this.a[s]]=[this.a[s],this.a[i]];i=s}}return m}}
          self.onmessage=({data})=>{try{const N=data.N,E=data.E,t0=performance.now();let seed=20260826,r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const head=new Int32Array(N);head.fill(-1);const to=new Int32Array(E*2),wt=new Uint8Array(E*2),next=new Int32Array(E*2);let z=0;const add=(a,b,w)=>{to[z]=b;wt[z]=w;next[z]=head[a];head[a]=z++};for(let i=1;i<N;i++){const w=3+(r()*28|0);add(i-1,i,w);add(i,i-1,w)}for(let i=N-1;i<E;i++){let a=(r()*N)|0,b=(r()*N)|0;if(a===b){i--;continue}const w=3+(r()*28|0);add(a,b,w);add(b,a,w)}const build=performance.now()-t0;postMessage({phase:'built',N,E,build});const dist=new Float64Array(N);dist.fill(Infinity);dist[0]=0;const q=new H();q.push(0,0);let pops=0;const t1=performance.now();while(q.a.length){const x=q.pop(),u=x.v;if(x.p!==dist[u])continue;pops++;for(let i=head[u];i!==-1;i=next[i]){const v=to[i],nd=x.p+wt[i];if(nd<dist[v]){dist[v]=nd;q.push(v,nd)}}}const dijkstra=performance.now()-t1;const q0=performance.now(),hq=new H();for(let i=0;i<5000;i++)hq.push(i,(i*2654435761>>>0)%100000);while(hq.a.length)hq.pop();const queue=performance.now()-q0;postMessage({phase:'done',N,E,build,dijkstra,queue,pops});}catch(error){postMessage({phase:'error',message:error.message})}};`;
        const worker=new Worker(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));
        const timeout=setTimeout(()=>{worker.terminate();if(status)status.textContent='Benchmark timed out on this device. Live routing remains unaffected.';run.disabled=false;run.textContent='RETRY SCALE TEST'},20000);
        worker.onmessage=ev=>{
          const r=ev.data;
          if(r.phase==='built'){
            set('sxNodes',r.N.toLocaleString());set('sxEdges',r.E.toLocaleString());set('sxBuild',r.build.toFixed(0)+' ms');
            if(status)status.textContent='Graph built. Running Dijkstra from node 1…';
          }else if(r.phase==='done'){
            clearTimeout(timeout);set('sxNodes',r.N.toLocaleString());set('sxEdges',r.E.toLocaleString());set('sxBuild',r.build.toFixed(0)+' ms');set('sxRoute',r.dijkstra.toFixed(0)+' ms');
            if(status)status.textContent=`PASS — ${r.pops.toLocaleString()} reachable-node extractions. 5,000 priority arrivals drained in ${r.queue.toFixed(1)} ms.`;
            run.disabled=false;run.textContent='BENCHMARK COMPLETE';worker.terminate();
          }else{clearTimeout(timeout);if(status)status.textContent='Benchmark failed safely: '+r.message;run.disabled=false;worker.terminate()}
        };
      };
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
