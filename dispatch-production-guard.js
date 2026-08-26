(()=>{
  'use strict';
  const boot=()=>{
    const btn=document.getElementById('dispatch');
    if(!btn||typeof window.dispatch!=='function'||btn.dataset.mrGuarded==='1')return;
    btn.dataset.mrGuarded='1';
    btn.addEventListener('click',(event)=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      if(btn.disabled)return;
      const select=document.getElementById('specialty');
      if(select&&!select.value){
        const first=[...select.options].find(o=>o.value&&!o.disabled);
        if(first)select.value=first.value;
      }
      try{
        window.dispatch();
      }catch(error){
        console.error('[MED-ROUTE] guarded dispatch failure',error);
        btn.disabled=false;
        btn.textContent='AUTHORIZE DISPATCH';
        const mode=document.getElementById('mode');
        if(mode){mode.textContent='READY';mode.style.color='var(--lime)'}
        if(typeof window.toast==='function')window.toast('DISPATCH RETRY', 'Routing engine recovered. Select a specialty and retry.');
      }
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
