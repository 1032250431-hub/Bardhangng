(()=>{
'use strict';

const repair=()=>{
  const panel=document.querySelector('.panel');
  if(!panel)return false;

  const styleId='mr-command-runtime-fix';
  if(!document.getElementById(styleId)){
    const style=document.createElement('style');
    style.id=styleId;
    style.textContent=`
      .mr-command-runtime-panel{display:flex!important;flex-direction:column!important;min-width:0!important;width:100%!important;box-sizing:border-box!important;overflow:hidden!important;background:#081216!important;color:#dce9e7!important}
      .mr-command-runtime-panel>*{box-sizing:border-box!important;white-space:normal!important}
      .mr-command-runtime-panel>.block,.mr-command-runtime-panel>.label,.mr-command-runtime-panel>.meta,.mr-command-runtime-panel>#hospitals,.mr-command-runtime-panel>#fleet,.mr-command-runtime-panel>.timeline,.mr-command-runtime-panel>#result,.mr-command-runtime-panel>.tools{display:block!important;width:100%!important}
      .mr-command-runtime-panel>.block{padding:16px 19px!important;border-bottom:1px solid rgba(224,246,244,.106)!important;clear:both!important}
      .mr-command-runtime-panel .label{font:7px/1.25 'IBM Plex Mono',monospace!important;letter-spacing:.18em!important;color:#607578!important;margin:0 0 8px!important}
      .mr-command-runtime-panel .select{display:block!important;width:100%!important;height:42px!important;min-height:42px!important;margin:0!important;padding:0 11px!important;box-sizing:border-box!important;border:1px solid rgba(224,246,244,.106)!important;background:#05090c!important;color:#dce9e7!important;font:8px/42px 'IBM Plex Mono',monospace!important}
      .mr-command-runtime-panel .dispatch{display:block!important;width:100%!important;height:43px!important;min-height:43px!important;margin:7px 0 0!important;padding:0 10px!important;border:0!important;background:#61e7e1!important;color:#031011!important;font:600 8px/43px 'IBM Plex Mono',monospace!important;letter-spacing:.16em!important;text-align:center!important}
      .mr-command-runtime-panel .meta{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:10px!important;margin-top:8px!important;font:7px/1.2 'IBM Plex Mono',monospace!important;color:#53696b!important}
      .mr-command-runtime-panel .hospitals{display:flex!important;flex-direction:column!important;gap:5px!important;width:100%!important;max-height:190px!important;overflow:auto!important;margin:0!important;padding:0!important}
      .mr-command-runtime-panel .hospital{display:block!important;width:100%!important;box-sizing:border-box!important;padding:9px!important;border:1px solid rgba(224,246,244,.067)!important;background:rgba(255,255,255,.012)!important;color:#d4e2e0!important;margin:0!important}
      .mr-command-runtime-panel .hrow{display:flex!important;justify-content:space-between!important;align-items:flex-start!important;gap:8px!important;width:100%!important}
      .mr-command-runtime-panel .hid{display:block!important;font:8px/1.2 'IBM Plex Mono',monospace!important;color:#d4e2e0!important}
      .mr-command-runtime-panel .spec{display:block!important;max-width:72%!important;font:6.5px/1.3 'IBM Plex Mono',monospace!important;color:#617678!important;text-align:right!important}
      .mr-command-runtime-panel .bars,.mr-command-runtime-panel .bars2{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;width:100%!important;margin-top:7px!important}
      .mr-command-runtime-panel .barlabel{display:flex!important;justify-content:space-between!important;font:6.5px/1.2 'IBM Plex Mono',monospace!important;color:#5e7476!important}
      .mr-command-runtime-panel .bar{display:block!important;width:100%!important;height:2px!important;margin-top:4px!important;background:#1b2a2e!important}
      .mr-command-runtime-panel .bar i{display:block!important;height:100%!important}
      .mr-command-runtime-panel .fleet{display:grid!important;grid-template-columns:repeat(10,minmax(0,1fr))!important;gap:3px!important;width:100%!important;margin:0!important;padding:0!important}
      .mr-command-runtime-panel .unit{display:block!important;width:auto!important;height:7px!important;background:#26363a!important}
      .mr-command-runtime-panel .timeline{display:flex!important;flex-direction:column!important;flex:1 1 auto!important;width:100%!important;min-height:175px!important;padding:15px 19px!important}
      .mr-command-runtime-panel .logs{display:block!important;flex:1 1 auto!important;width:100%!important;min-height:70px!important;overflow:auto!important;margin-top:6px!important}
      .mr-command-runtime-panel .log{display:grid!important;grid-template-columns:5px minmax(0,1fr)!important;gap:7px!important;width:100%!important;padding:3px 0!important;font:7px/1.5 'IBM Plex Mono',monospace!important;white-space:normal!important}
      .mr-command-runtime-panel .result{display:block!important;width:100%!important;box-sizing:border-box!important;padding:12px 19px!important;border-top:1px solid rgba(224,246,244,.106)!important}
      .mr-command-runtime-panel .result.hidden{display:none!important}
      .mr-command-runtime-panel .tools{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;width:100%!important;margin:0!important}
      .mr-command-runtime-panel .tool{display:block!important;width:100%!important;height:34px!important;min-height:34px!important;box-sizing:border-box!important;padding:0 6px!important;border:1px solid rgba(224,246,244,.106)!important;background:rgba(255,255,255,.012)!important;color:#91a6a7!important;font:7px/34px 'IBM Plex Mono',monospace!important;text-align:center!important;white-space:nowrap!important}
      @media(max-width:900px){.mr-command-runtime-panel{border-left:0!important;border-top:1px solid rgba(224,246,244,.106)!important}.mr-command-runtime-panel>.block{padding:14px!important}.mr-command-runtime-panel .hospitals{max-height:240px!important}.mr-command-runtime-panel .timeline{min-height:220px!important}}
      @media(max-width:560px){.mr-command-runtime-panel .tools{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  panel.classList.add('mr-command-runtime-panel');
  panel.style.display='flex';
  panel.style.flexDirection='column';
  panel.style.width='100%';
  panel.style.minWidth='0';
  panel.style.boxSizing='border-box';

  panel.querySelectorAll('.block').forEach(el=>{
    el.style.display='block';
    el.style.width='100%';
    el.style.boxSizing='border-box';
  });

  const ids=['specialty','urgency','timeWindow','dispatch','origin','mapStatus','hospitals','fleet','fleetCount','logs','result','benchNote','benchgrid'];
  ids.forEach(id=>{const el=document.getElementById(id);if(el)el.style.boxSizing='border-box'});

  const hospitals=document.getElementById('hospitals');
  if(hospitals){
    hospitals.style.display='flex';
    hospitals.style.flexDirection='column';
    hospitals.style.width='100%';
    hospitals.style.gap='5px';
    hospitals.querySelectorAll('.hospital').forEach(el=>{
      el.style.display='block';
      el.style.width='100%';
      el.style.boxSizing='border-box';
    });
  }

  const fleet=document.getElementById('fleet');
  if(fleet){fleet.style.display='grid';fleet.style.gridTemplateColumns='repeat(10,minmax(0,1fr))';}
  const logs=document.getElementById('logs');
  if(logs){logs.style.display='block';logs.querySelectorAll('.log').forEach(el=>el.style.display='grid');}
  const tools=panel.querySelector('.tools');
  if(tools){tools.style.display='grid';tools.querySelectorAll('.tool').forEach(el=>{el.style.display='block';el.style.width='100%'});}
  return true;
};

const boot=()=>{if(repair())return;let attempts=0;const timer=setInterval(()=>{attempts++;if(repair()||attempts>40)clearInterval(timer)},100)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('load',repair,{once:true});
})();
