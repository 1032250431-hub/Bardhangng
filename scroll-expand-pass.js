/* MED-ROUTE ScrollExpand — browser-native, dependency-free adaptation. */
(()=>{
  'use strict';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const markup=()=>{
    if(document.querySelector('[data-scroll-expand]'))return;
    const root=document.createElement('section');
    root.className='mr-scroll-expand';root.dataset.scrollExpand='1';root.setAttribute('aria-label','MED-ROUTE command center reveal');
    root.innerHTML=`<div class="mr-scroll-expand__stage"><div class="mr-scroll-expand__frame"><img class="mr-scroll-expand__media" src="/docs/dashboard-preview.svg" alt="MED-ROUTE emergency command center dashboard preview"><div class="mr-scroll-expand__scrim"></div><div class="mr-scroll-expand__hint"><i></i>SCROLL TO ENTER COMMAND CENTER</div><div class="mr-scroll-expand__title"><div class="mr-scroll-expand__eyebrow">03 / COMMAND CENTER</div><h2 class="mr-scroll-expand__heading">From signal to dispatch.</h2></div></div></div><div class="mr-scroll-expand__caption">LIVE GRAPH · HEALTHCARE CONSTRAINTS · EDGE TELEMETRY · EXPLAINABLE ROUTING</div></section>`;
    const anchor=document.querySelector('.command');
    if(anchor)anchor.parentNode.insertBefore(root,anchor);else document.body.appendChild(root);
  };
  const boot=()=>{
    markup();
    const root=document.querySelector('[data-scroll-expand]');
    const frame=root?.querySelector('.mr-scroll-expand__frame');
    const media=root?.querySelector('.mr-scroll-expand__media');
    const title=root?.querySelector('.mr-scroll-expand__title');
    const hint=root?.querySelector('.mr-scroll-expand__hint');
    const caption=root?.querySelector('.mr-scroll-expand__caption');
    if(!root||!frame||!media)return;
    if(reduced)return;
    let raf=0;
    const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
    const tick=()=>{
      raf=0;
      const r=root.getBoundingClientRect();
      const travel=Math.max(1,root.offsetHeight-window.innerHeight);
      const p=clamp(-r.top/travel);
      const eased=p*p*(3-2*p);
      frame.style.width=`${78+(100-78)*eased}vw`;
      frame.style.height=`${68+(100-68)*eased}vh`;
      frame.style.borderRadius=`${Math.max(0,18*(1-eased))}px`;
      media.style.transform=`scale(${1+0.055*eased})`;
      if(title){title.style.opacity=String(clamp(1-eased*1.9));title.style.transform=`translateY(${eased*22}px)`}
      if(hint)hint.style.opacity=String(clamp(1-eased*2.2));
      if(caption){const c=clamp((eased-.72)*3.5);caption.style.opacity=String(c);caption.style.transform=`translateY(${(1-c)*8}px)`}
    };
    const request=()=>{if(!raf)raf=requestAnimationFrame(tick)};
    addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});request();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
