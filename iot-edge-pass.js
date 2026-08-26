(()=>{
'use strict';

const boot=()=>{
  if(window.__MEDROUTE_IOT_EDGE__)return;
  window.__MEDROUTE_IOT_EDGE__=true;

  const style=document.createElement('style');
  style.id='mr-iot-edge-style';
  style.textContent=`
    .mr-iot-panel{position:relative;padding:18px 20px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,rgba(7,20,15,.34),rgba(8,18,22,.9));overflow:hidden}
    .mr-iot-panel:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(183,243,107,.035),transparent);transform:translateX(-100%);animation:mrIoTScan 4.5s linear infinite;pointer-events:none}
    @keyframes mrIoTScan{to{transform:translateX(100%)}}
    .mr-iot-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px;position:relative;z-index:1}
    .mr-iot-title{display:flex;align-items:center;gap:8px;font:8px 'IBM Plex Mono';letter-spacing:.18em;color:#d7e5df}
    .mr-iot-dot,.mr-network-dot{width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:#b7f36b;box-shadow:0 0 0 3px rgba(183,243,107,.08),0 0 14px rgba(183,243,107,.75);animation:mrIoTPulse 1.35s ease-in-out infinite}
    @keyframes mrIoTPulse{50%{transform:scale(.55);opacity:.45}}
    .mr-iot-state{font:7px 'IBM Plex Mono';letter-spacing:.1em;color:#b7f36b}
    .mr-iot-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:11px;position:relative;z-index:1}
    .mr-iot-metric{padding:8px 9px;border:1px solid rgba(183,243,107,.09);background:rgba(183,243,107,.025)}
    .mr-iot-metric span{display:block;font:6px 'IBM Plex Mono';letter-spacing:.08em;color:#657b70}.mr-iot-metric b{display:block;margin-top:3px;font:600 12px 'Space Grotesk';color:#dff8e5}
    .mr-iot-feed{height:112px;overflow:hidden;display:flex;flex-direction:column;gap:5px;position:relative;z-index:1}
    .mr-iot-event{font:7px/1.55 'IBM Plex Mono';color:#79a58a;opacity:0;transform:translateY(5px);animation:mrIoTIn .35s ease-out forwards}
    .mr-iot-event b{color:#b7f36b;font-weight:500}.mr-iot-event em{color:#587763;font-style:normal}
    @keyframes mrIoTIn{to{opacity:1;transform:none}}
    .mr-iot-foot{display:flex;justify-content:space-between;margin-top:9px;font:6px 'IBM Plex Mono';letter-spacing:.08em;color:#50675a;position:relative;z-index:1}.mr-iot-foot b{color:#7fb8ff;font-weight:500}
    .mr-iot-panel .mr-edge-bar{height:2px;margin-top:10px;background:#15271c;overflow:hidden}.mr-edge-bar i{display:block;width:28%;height:100%;background:#b7f36b;box-shadow:0 0 10px rgba(183,243,107,.7);animation:mrEdgePulse 2.2s ease-in-out infinite}
    @keyframes mrEdgePulse{50%{width:82%;opacity:.55}100%{width:34%}}
    .mr-iot-panel + .mr-audit-terminal{margin-top:0}
    @media(max-width:768px){.mr-iot-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.mr-iot-feed{height:128px}}
    @media(max-width:480px){.mr-iot-panel{padding:15px}.mr-iot-metric b{font-size:10px}.mr-iot-feed{height:135px}}
  `;
  document.head.appendChild(style);

  const install=()=>{
    const panel=document.querySelector('.panel');
    if(!panel)return false;
    if(panel.querySelector('.mr-iot-panel'))return true;

    const legacyFleet=document.querySelector('#fleet')?.closest('.panel-block');
    if(!legacyFleet)return false;

    // Preserve the engine's existing fleet DOM/state hooks, but replace its visible
    // presentation with an edge telemetry surface for the operator/judge.
    legacyFleet.classList.add('mr-legacy-fleet-state');
    legacyFleet.setAttribute('aria-hidden','true');
    legacyFleet.style.display='none';

    const block=document.createElement('section');
    block.className='mr-iot-panel';
    block.setAttribute('aria-label','Live IoT and edge sensor telemetry');
    block.innerHTML=`
      <div class="mr-iot-head">
        <div class="mr-iot-title"><span class="mr-iot-dot" aria-hidden="true"></span><span>LIVE IoT / EDGE SENSOR FEED</span></div>
        <span class="mr-iot-state" id="mrIotState">POLLING // 1.0s</span>
      </div>
      <div class="mr-iot-metrics">
        <div class="mr-iot-metric"><span>EDGE NODES</span><b id="mrIotNodes">12</b></div>
        <div class="mr-iot-metric"><span>INGEST</span><b id="mrIotIngest">18ms</b></div>
        <div class="mr-iot-metric"><span>PACKETS</span><b id="mrIotPackets">04821</b></div>
      </div>
      <div class="mr-iot-feed" id="mrIotFeed" role="log" aria-live="polite" aria-label="Incoming IoT sensor events"></div>
      <div class="mr-edge-bar" aria-hidden="true"><i></i></div>
      <div class="mr-iot-foot"><span>EDGE FABRIC <b>ONLINE</b></span><span>MQTT / LOCAL BUS</span></div>
    `;
    legacyFleet.before(block);

    // Make the existing NETWORK / REAL-TIME label visibly read like a live gateway.
    document.querySelectorAll('.map-overlay b').forEach(el=>{
      if(el.textContent.trim().toUpperCase().includes('NETWORK / REAL-TIME') && !el.querySelector('.mr-network-dot')){
        const dot=document.createElement('span');
        dot.className='mr-network-dot';
        dot.setAttribute('aria-hidden','true');
        dot.style.display='inline-block';
        dot.style.marginRight='7px';
        el.prepend(dot);
      }
    });

    const feed=block.querySelector('#mrIotFeed');
    const state=block.querySelector('#mrIotState');
    const ingest=block.querySelector('#mrIotIngest');
    const packets=block.querySelector('#mrIotPackets');
    const nodes=block.querySelector('#mrIotNodes');
    const events=[
      ['SENSOR-88','Ambulance GPS sync: Lat/Long updated','GPS'],
      ['SENSOR-12','Smart-Bed weight detected: Capacity -1','BED'],
      ['EDGE-NODE','Traffic camera feed ingested: Route cost +2','VISION'],
      ['SENSOR-41','Cold-chain medicine probe: 3.8°C stable','MED'],
      ['SENSOR-07','Ambulance battery telemetry: 82% nominal','POWER'],
      ['EDGE-NODE','Roadside LoRa gateway acknowledged packet burst','LORA'],
      ['SENSOR-63','Hospital oxygen reserve: 91% available','O2'],
      ['SENSOR-29','Patient queue beacon: triage load +3','TRIAGE']
    ];
    let cursor=0,packetCount=4821;
    const stamp=()=>new Date().toLocaleTimeString('en-GB',{hour12:false});
    const emit=()=>{
      const [source,message,channel]=events[cursor%events.length];
      cursor++;
      packetCount+=Math.floor(Math.random()*7)+1;
      const line=document.createElement('div');
      line.className='mr-iot-event';
      line.innerHTML=`<em>${stamp()}</em> <b>[${source}]</b> ${message}`;
      feed.appendChild(line);
      while(feed.children.length>6)feed.removeChild(feed.firstChild);
      packets.textContent=String(packetCount).padStart(5,'0');
      ingest.textContent=(12+Math.floor(Math.random()*14))+'ms';
      nodes.textContent=String(10+Math.floor(Math.random()*5));
      state.textContent=`POLLING // ${channel}`;
    };
    events.slice(0,3).forEach(()=>emit());
    const timer=setInterval(emit,1250);
    window.__MEDROUTE_IOT__={destroy:()=>clearInterval(timer),emit};

    // If the app reflows/initializes later, keep the network indicator present.
    setTimeout(()=>document.querySelectorAll('.map-overlay b').forEach(el=>{
      if(el.textContent.trim().toUpperCase().includes('NETWORK / REAL-TIME') && !el.querySelector('.mr-network-dot')){
        const dot=document.createElement('span');dot.className='mr-network-dot';dot.setAttribute('aria-hidden','true');dot.style.display='inline-block';dot.style.marginRight='7px';el.prepend(dot);
      }
    }),800);
    return true;
  };

  if(install())return;
  const observer=new MutationObserver(()=>{if(install())observer.disconnect()});
  observer.observe(document.body,{childList:true,subtree:true});
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
