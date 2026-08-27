(()=>{
  'use strict';
  if(window.__MEDROUTE_ROUTE_VISUAL_FIX__) return;
  window.__MEDROUTE_ROUTE_VISUAL_FIX__=true;

  const style=document.createElement('style');
  style.id='mr-route-visual-fix-style';
  style.textContent=`
    .mr-route-visual-pane{pointer-events:none!important;z-index:650!important}
    .mr-dispatch-route-glow{
      stroke:#65e6e2!important;
      stroke-width:5!important;
      stroke-opacity:1!important;
      stroke-linecap:round!important;
      stroke-linejoin:round!important;
      stroke-dasharray:16 10!important;
      animation:mrRouteFlow .58s linear infinite!important;
      filter:drop-shadow(0 0 4px rgba(101,230,226,.95)) drop-shadow(0 0 12px rgba(101,230,226,.55))!important;
      fill:none!important;
      pointer-events:none!important;
    }
    .mr-dispatch-route-core{
      stroke:#e9fffd!important;
      stroke-width:2!important;
      stroke-opacity:.95!important;
      stroke-linecap:round!important;
      pointer-events:none!important;
      fill:none!important;
    }
    .mr-route-pulse{
      fill:#65e6e2!important;
      stroke:#effffd!important;
      stroke-width:2!important;
      filter:drop-shadow(0 0 8px rgba(101,230,226,.95))!important;
      pointer-events:none!important;
    }
    .mr-route-destination{
      fill:#b7f36b!important;
      stroke:#efffd7!important;
      stroke-width:2!important;
      filter:drop-shadow(0 0 9px rgba(183,243,107,.95))!important;
      pointer-events:none!important;
    }
    @keyframes mrRouteFlow{to{stroke-dashoffset:-26}}
    @keyframes mrRouteBeacon{50%{opacity:.35;transform:scale(1.35)}}
    @media(prefers-reduced-motion:reduce){.mr-dispatch-route-glow{animation:none!important}}
  `;
  document.head.appendChild(style);

  const tracked=new WeakMap();
  let raf=0;
  let activePulse=null;
  let activePulseData=null;

  function installMap(map){
    if(!map || map.__mrRouteVisualReady) return;
    map.__mrRouteVisualReady=true;

    if(!map.getPane('mrRouteVisualPane')){
      const pane=map.createPane('mrRouteVisualPane');
      pane.classList.add('mr-route-visual-pane');
    }

    const svgRenderer=L.svg({padding:0.5,pane:'mrRouteVisualPane'});
    svgRenderer.addTo(map);
    map.__mrRouteSvgRenderer=svgRenderer;

    const removeVisual=(layer)=>{
      const visual=tracked.get(layer);
      if(!visual) return;
      if(visual.glow) map.removeLayer(visual.glow);
      if(visual.core) map.removeLayer(visual.core);
      if(visual.destination) map.removeLayer(visual.destination);
      if(visual.origin) map.removeLayer(visual.origin);
      if(activePulseData && activePulseData.layer===layer){
        activePulseData=null;
        activePulse=null;
      }
      tracked.delete(layer);
    };

    const enhanceLayer=(layer)=>{
      if(!layer || !layer.options || layer.options.className!=='route-glow') return;
      if(tracked.has(layer)) return;
      if(typeof layer.getLatLngs!=='function') return;

      const latlngs=layer.getLatLngs();
      if(!Array.isArray(latlngs) || latlngs.length<2) return;

      const glow=L.polyline(latlngs,{
        renderer:svgRenderer,
        pane:'mrRouteVisualPane',
        className:'mr-dispatch-route-glow',
        color:'#65e6e2',
        weight:5,
        opacity:1,
        interactive:false
      }).addTo(map);

      const core=L.polyline(latlngs,{
        renderer:svgRenderer,
        pane:'mrRouteVisualPane',
        className:'mr-dispatch-route-core',
        color:'#e9fffd',
        weight:2,
        opacity:.95,
        interactive:false
      }).addTo(map);

      const end=latlngs[latlngs.length-1];
      const destination=L.circleMarker(end,{
        renderer:svgRenderer,
        pane:'mrRouteVisualPane',
        className:'mr-route-destination',
        radius:6,
        color:'#efffd7',
        fillColor:'#b7f36b',
        fillOpacity:1,
        weight:2,
        interactive:false
      }).addTo(map);

      const distances=[0];
      let total=0;
      for(let i=1;i<latlngs.length;i++){
        total+=latlngs[i-1].distanceTo(latlngs[i]);
        distances.push(total);
      }

      const visual={glow,core,destination,latlngs,distances,total};
      tracked.set(layer,visual);

      activePulseData={layer,visual,duration:Math.max(1200,Math.min(3200,total*0.012)),started:performance.now()};
      if(!raf) raf=requestAnimationFrame(tick);
    };

    map.on('layeradd',e=>enhanceLayer(e.layer));
    map.on('layerremove',e=>removeVisual(e.layer));
    map.on('unload',()=>{
      activePulseData=null;
      activePulse=null;
      if(raf){cancelAnimationFrame(raf);raf=0;}
    });

    // Catch a route that was added before this enhancement script attached.
    map.eachLayer(enhanceLayer);
  }

  function tick(now){
    raf=0;
    const data=activePulseData;
    if(!data) return;
    const {latlngs,distances,total}=data.visual;
    if(!total || latlngs.length<2) return;

    let progress=((now-data.started)%data.duration)/data.duration;
    const target=progress*total;
    let index=1;
    while(index<distances.length && distances[index]<target) index++;
    const a=latlngs[Math.max(0,index-1)];
    const b=latlngs[Math.min(latlngs.length-1,index)];
    const da=distances[Math.max(0,index-1)];
    const db=distances[Math.min(distances.length-1,index)];
    const ratio=db===da?0:(target-da)/(db-da);
    const lat=a.lat+(b.lat-a.lat)*ratio;
    const lng=a.lng+(b.lng-a.lng)*ratio;

    if(!activePulse){
      activePulse=L.circleMarker([lat,lng],{
        renderer:data.visual.glow._renderer,
        pane:'mrRouteVisualPane',
        className:'mr-route-pulse',
        radius:5,
        color:'#effffd',
        fillColor:'#65e6e2',
        fillOpacity:1,
        weight:2,
        interactive:false
      }).addTo(data.layer._map);
    }else if(activePulse._map){
      activePulse.setLatLng([lat,lng]);
    }

    raf=requestAnimationFrame(tick);
  }

  const boot=()=>{
    const map=document.getElementById('workmap')?.__mrMapInstance;
    if(map) installMap(map);

    // The production page creates the Leaflet instance from its inline load handler.
    // Poll only until that instance exists; this loop terminates immediately afterward.
    if(!window.__MEDROUTE_ROUTE_MAP_WATCH__){
      window.__MEDROUTE_ROUTE_MAP_WATCH__=true;
      let attempts=0;
      const timer=setInterval(()=>{
        attempts++;
        const host=document.getElementById('workmap');
        const map=host && host._leaflet_id ? host.__mrMapInstance : null;
        if(map){installMap(map);clearInterval(timer);return;}
        // Leaflet instances created by the inline app are not always exposed on the DOM node.
        // Discover the map from the Leaflet layer container without touching routing state.
        if(host && window.L && host._leaflet_id){
          try{
            const candidate=window.__MEDROUTE_WORKMAP__;
            if(candidate){installMap(candidate);clearInterval(timer);return;}
          }catch(_e){}
        }
        if(attempts>=80) clearInterval(timer);
      },100);
    }
  };

  // Bridge the existing map variable without changing its routing behavior.
  const bridge=()=>{
    if(window.__MEDROUTE_WORKMAP_BRIDGED__) return;
    window.__MEDROUTE_WORKMAP_BRIDGED__=true;
    const host=document.getElementById('workmap');
    if(!host) return;
    const descriptor=Object.getOwnPropertyDescriptor(window,'workmap');
    if(descriptor && descriptor.set) return;
    let value=window.workmap;
    try{
      Object.defineProperty(window,'workmap',{
        configurable:true,
        get(){return value;},
        set(v){value=v;host.__mrMapInstance=v;installMap(v);}
      });
    }catch(_e){/* fallback to discovery */}
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{bridge();boot();},{once:true});
  }else{bridge();boot();}
  window.addEventListener('load',()=>{bridge();boot();}, {once:true});
})();
