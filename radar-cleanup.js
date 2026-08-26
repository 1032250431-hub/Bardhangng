(()=>{
  'use strict';
  const clean=()=>{
    document.querySelectorAll('.mr-radar-layer,.mr-radar-ring').forEach(el=>el.remove());
    const hero=window.__MEDROUTE_HERO_STATE__;
    if(hero?.rings) hero.rings.length=0;
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  setTimeout(clean,250);
})();
