(()=>{
  'use strict';
  if(window.__MEDROUTE_ROUTE_VISUAL_FIX__) return;
  window.__MEDROUTE_ROUTE_VISUAL_FIX__=true;

  const style=document.createElement('style');
  style.id='mr-route-visual-fix-style';
  style.textContent=`
    #workmap .mr-dispatch-route-glow{
      stroke:#65e6e2!important;
      stroke-width:5!important;
      stroke-opacity:1!important;
      stroke-linecap:round!important;
      stroke-linejoin:round!important;
      stroke-dasharray:14 10!important;
      animation:mrRouteFlow .62s linear infinite!important;
      filter:drop-shadow(0 0 4px rgba(101,230,226,.95)) drop-shadow(0 0 12px rgba(101,230,226,.55))!important;
    }
    #workmap .mr-dispatch-route-core{
      stroke:#d7fffd!important;
      stroke-width:2!important;
      stroke-opacity:.9!important;
      stroke-linecap:round!important;
      pointer-events:none!important;
    }
    .mr-route-pulse{
      fill:#65e6e2;
      stroke:#d9fffd;
      stroke-width:2;
      filter:drop-shadow(0 0 7px rgba(101,230,226,.95));
      pointer-events:none;
    }
    .mr-route-destination{
      fill:#b7f36b;
      stroke:#efffd7;
      stroke-width:2;
      filter:drop-shadow(0 0 8px rgba(183,243,107,.9));
      pointer-events:none;
    }
    @keyframes mrRouteFlow{to{stroke-dashoffset:-24}}
    @media(prefers-reduced-motion:reduce){#workmap .mr-dispatch-route-glow{animation:none!important}}
  `;
  document.head.appendChild(style);

  const enhance=()=>{
    const host=document.getElementById('workmap');
    if(!host) return;
    const paths=host.querySelectorAll('path.route-glow:not(.mr-route-enhanced)');
    paths.forEach(path=>{
      path.classList.add('mr-route-enhanced','mr-dispatch-route-glow');
      path.removeAttribute('filter');
      if(!path.id) path.id='mr-dispatch-route-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);

      const svg=path.closest('svg');
      if(!svg) return;

      const oldCore=svg.querySelector('.mr-dispatch-route-core');
      if(oldCore) oldCore.remove();
      const oldPulse=svg.querySelector('.mr-route-pulse');
      if(oldPulse) oldPulse.remove();
      const oldDest=svg.querySelector('.mr-route-destination');
      if(oldDest) oldDest.remove();

      const core=path.cloneNode(false);
      core.classList.remove('route-glow','mr-route-enhanced','mr-dispatch-route-glow');
      core.classList.add('mr-dispatch-route-core');
      core.setAttribute('fill','none');
      svg.appendChild(core);

      const start=path.getPointAtLength(0);
      const end=path.getPointAtLength(Math.max(0,path.getTotalLength()-1));
      const ns='http://www.w3.org/2000/svg';

      const pulse=document.createElementNS(ns,'circle');
      pulse.setAttribute('r','5');
      pulse.setAttribute('class','mr-route-pulse');
      const motion=document.createElementNS(ns,'animateMotion');
      motion.setAttribute('dur','1.65s');
      motion.setAttribute('repeatCount','indefinite');
      motion.setAttribute('rotate','auto');
      const mpath=document.createElementNS(ns,'mpath');
      mpath.setAttribute('href','#'+path.id);
      mpath.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href','#'+path.id);
      motion.appendChild(mpath);
      pulse.appendChild(motion);
      svg.appendChild(pulse);

      const dest=document.createElementNS(ns,'circle');
      dest.setAttribute('cx',end.x);
      dest.setAttribute('cy',end.y);
      dest.setAttribute('r','6');
      dest.setAttribute('class','mr-route-destination');
      svg.appendChild(dest);

      requestAnimationFrame(()=>{
        const pulseMotion=pulse.querySelector('animateMotion');
        if(pulseMotion&&typeof pulseMotion.beginElement==='function'){
          try{pulseMotion.beginElement()}catch(_e){}
        }
      });
    });
  };

  const observer=new MutationObserver(enhance);
  const boot=()=>{
    const host=document.getElementById('workmap');
    if(!host) return;
    observer.observe(host,{childList:true,subtree:true});
    enhance();
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('load',()=>setTimeout(enhance,120),{once:true});
})();
