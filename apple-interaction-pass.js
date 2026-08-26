(()=>{
  'use strict';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const interactive='button,a,[role="button"],select,.hospital,.tool,.card';
  const boot=()=>{
    document.querySelectorAll(interactive).forEach(el=>{
      if(el.dataset.appleFluid==='1')return;
      el.dataset.appleFluid='1';
      el.addEventListener('pointerdown',e=>{
        if(e.button!==undefined&&e.button!==0)return;
        el.setPointerCapture?.(e.pointerId);
        const r=el.getBoundingClientRect();
        el.style.setProperty('--mr-origin-x',`${e.clientX-r.left}px`);
        el.style.setProperty('--mr-origin-y',`${e.clientY-r.top}px`);
        if(!reduced)el.animate([{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
      },{passive:true});
    });
    const hero=document.querySelector('.hero');
    if(hero&&!reduced&&!hero.dataset.appleSpotlight){
      hero.dataset.appleSpotlight='1';
      let raf=0,x=0,y=0;
      hero.addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;if(raf)return;raf=requestAnimationFrame(()=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--apple-mx',`${x-r.left}px`);hero.style.setProperty('--apple-my',`${y-r.top}px`);raf=0})},{passive:true});
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
