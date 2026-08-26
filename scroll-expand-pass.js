/* MED-ROUTE ScrollExpand — browser-native, dependency-free adaptation. */
(()=>{
  'use strict';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const boot=()=>{
    if(reduced)return;
    const root=document.querySelector('[data-scroll-expand]');
    if(!root)return;
    const frame=root.querySelector('.mr-scroll-expand__frame');
    const media=root.querySelector('.mr-scroll-expand__media');
    const title=root.querySelector('.mr-scroll-expand__title');
    const hint=root.querySelector('.mr-scroll-expand__hint');
    const caption=root.querySelector('.mr-scroll-expand__caption');
    if(!frame||!media)return;
    let raf=0;
    const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
    const tick=()=>{
      raf=0;
      const r=root.getBoundingClientRect();
      const travel=Math.max(1,root.offsetHeight-window.innerHeight);
      const p=clamp(-r.top/travel);
      const eased=p*p*(3-2*p);
      const width=78+(100-78)*eased;
      const height=68+(100-68)*eased;
      const radius=Math.max(0,18*(1-eased));
      const scale=1+0.055*eased;
      frame.style.width=`${width}vw`;
      frame.style.height=`${height}vh`;
      frame.style.borderRadius=`${radius}px`;
      media.style.transform=`scale(${scale})`;
      if(title) { title.style.opacity=String(clamp(1-eased*1.9)); title.style.transform=`translateY(${eased*22}px)`; }
      if(hint) hint.style.opacity=String(clamp(1-eased*2.2));
      if(caption) { caption.style.opacity=String(clamp((eased-.72)*3.5)); caption.style.transform=`translateY(${(1-clamp((eased-.72)*3.5))*8}px)`; }
    };
    const request=()=>{if(!raf)raf=requestAnimationFrame(tick)};
    addEventListener('scroll',request,{passive:true});
    addEventListener('resize',request,{passive:true});
    request();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
