(()=>{
  'use strict';
  if(window.__MEDROUTE_ROUTE_VISUAL_FIX__) return;
  window.__MEDROUTE_ROUTE_VISUAL_FIX__=true;

  const style=document.createElement('style');
  style.id='mr-route-visual-fix-style';
  style.textContent=`
    .mr-route-visual-pane{pointer-events:none!important;z-index:650!important}
    .mr-dispatch-route-glow{stroke:#65e6e2!important;stroke-width:6!important;stroke-opacity:1!important;stroke-linecap:round!important;stroke-linejoin:round!important;stroke-dasharray:18 10!important;animation:mrRouteFlow .55s linear infinite!important;filter:drop-shadow(0 0 5px rgba(101,230,226,.95)) drop-shadow(0 0 14px rgba(101,230,226,.55))!important;fill:none!important;pointer-events:none!important}
    .mr-dispatch-route-core{stroke:#effffd!important;stroke-width:2!important;stroke-opacity:.95!important;stroke-linecap:round!important;fill:none!important;pointer-events:none!important}
    .mr-route-pulse{fill:#65e6e2!important;stroke:#effffd!important;stroke-width:2!important;filter:drop-shadow(0 0 9px rgba(101,230,226,1))!important;pointer-events:none!important}
    .mr-route-destination{fill:#b7f36b!important;stroke:#efffd7!important;stroke-width:2!important;filter:drop-shadow(0 0 10px rgba(183,243,107,.95))!important;pointer-events:none!important}
    @keyframes mrRouteFlow{to{stroke-dashoffset:-28}}
    @media(prefers-reduced-motion:reduce){.mr-dispatch-route-glow{animation:none!important}}
  `;
  document.head.appendChild(style);

  const tracked=new WeakMap();
  let raf=0;
  let pulseState=null;

  function createVisual(layer,map){
    if(!layer || !map || tracked.has(layer) || layer.options?.className!=='route-glow') return;
    if(typeof layer.getLatLngs!=='function') return;
    const latlngs=layer.getLatLngs();
    if(!Array.isArray(latlngs) || latlngs.length<2) return;

    if(!map.getPane('mrRouteVisualPane')){
      const pane=map.createPane('mrRouteVisualPane');
      pane.classList.add('mr-route-visual-pane');
    }
    const renderer=map.__mrRouteSvgRenderer || L.svg({padding:.5,pane:'mrRouteVisualPane'});
    if(!map.__mrRouteSvgRenderer){renderer.addTo(map);map.__mrRouteSvgRenderer=renderer;}

    const glow=L.polyline(latlngs,{renderer,pane:'mrRouteVisualPane',className:'mr-dispatch-route-glow',color:'#65e6e2',weight:6,opacity:1,interactive:false}).addTo(map);
    const core=L.polyline(latlngs,{renderer,pane:'mrRouteVisualPane',className:'mr-dispatch-route-core',color:'#effffd',weight:2,opacity:.95,interactive:false}).addTo(map);
    const end=latlngs[latlngs.length-1];
    const destination=L.circleMarker(end,{renderer,pane:'mrRouteVisualPane',className:'mr-route-destination',radius:6,color:'#efffd7',fillColor:'#b7f36b',fillOpacity:1,weight:2,interactive:false}).addTo(map);

    const distances=[0];
    let total=0;
    for(let i=1;i<latlngs.length;i++){total+=latlngs[i-1].distanceTo(latlngs[i]);distances.push(total)}
    const visual={map,glow,core,destination,latlngs,distances,total,duration:Math.max(1200,Math.min(3200,total*.012))};
    tracked.set(layer,visual);
    pulseState={layer,visual,started:performance.now()};
    if(!raf) raf=requestAnimationFrame(tick);
  }

  function removeVisual(layer){
    const visual=tracked.get(layer);
    if(!visual)return;
    const {map,glow,core,destination}=visual;
    [glow,core,destination].forEach(x=>{try{if(x&&map.hasLayer(x))map.removeLayer(x)}catch(_e){}});
    if(pulseState?.layer===layer){pulseState=null;}
    tracked.delete(layer);
    if(!pulseState && raf){cancelAnimationFrame(raf);raf=0;}
  }

  function tick(now){
    raf=0;
    const state=pulseState;
    if(!state)return;
    const {map,latlngs,distances,total,duration}=state.visual;
    if(!map || !map._loaded || total<=0)return;

    const target=((now-state.started)%duration)/duration*total;
    let i=1;
    while(i<distances.length && distances[i]<target)i++;
    const a=latlngs[Math.max(0,i-1)],b=latlngs[Math.min(latlngs.length-1,i)];
    const da=distances[Math.max(0,i-1)],db=distances[Math.min(distances.length-1,i)];
    const ratio=db===da?0:(target-da)/(db-da);
    const lat=a.lat+(b.lat-a.lat)*ratio,lng=a.lng+(b.lng-a.lng)*ratio;

    if(!state.pulse){
      state.pulse=L.circleMarker([lat,lng],{renderer:state.visual.glow._renderer,pane:'mrRouteVisualPane',className:'mr-route-pulse',radius:5,color:'#effffd',fillColor:'#65e6e2',fillOpacity:1,weight:2,interactive:false}).addTo(map);
    }else state.pulse.setLatLng([lat,lng]);
    raf=requestAnimationFrame(tick);
  }

  function patchLeaflet(){
    if(!window.L || !L.Polyline)return false;
    if(L.Polyline.prototype.__mrRouteVisualPatched)return true;
    const originalAddTo=L.Polyline.prototype.addTo;
    const originalRemoveFrom=L.Polyline.prototype.removeFrom;

    L.Polyline.prototype.addTo=function(map){
      const result=originalAddTo.call(this,map);
      if(this.options && this.options.className==='route-glow'){
        // Let Leaflet finish inserting the Canvas layer before creating the SVG visual twin.
        requestAnimationFrame(()=>createVisual(this,map));
      }
      return result;
    };

    L.Polyline.prototype.removeFrom=function(map){
      if(this.options && this.options.className==='route-glow')removeVisual(this);
      return originalRemoveFrom.call(this,map);
    };
    L.Polyline.prototype.__mrRouteVisualPatched=true;
    return true;
  }

  const boot=()=>{if(patchLeaflet())return;let tries=0;const timer=setInterval(()=>{tries++;if(patchLeaflet()||tries>50)clearInterval(timer)},100)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',boot,{once:true});
})();
