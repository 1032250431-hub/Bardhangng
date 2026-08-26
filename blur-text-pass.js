/* MED-ROUTE BlurText — dependency-free production adaptation for the existing HTML/JS app. */
(()=>{
  'use strict';
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const mount=()=>{
    document.querySelectorAll('[data-blur-text]').forEach((el)=>{
      if(el.dataset.blurTextMounted==='1')return;
      el.dataset.blurTextMounted='1';
      const text=el.textContent||'';
      const mode=el.dataset.blurAnimateBy||'words';
      const direction=el.dataset.blurDirection||'top';
      const delay=Number(el.dataset.blurDelay||120);
      el.setAttribute('aria-label',text);
      el.textContent='';
      const parts=mode==='letters'?Array.from(text):text.split(' ');
      parts.forEach((part,i)=>{
        const span=document.createElement('span');
        span.className='mr-blur-word';
        span.textContent=part||'\u00a0';
        span.style.setProperty('--blur-delay',`${i*delay}ms`);
        span.style.setProperty('--blur-y',direction==='bottom'?'50px':'-50px');
        el.appendChild(span);
        if(mode==='words'&&i<parts.length-1)el.appendChild(document.createTextNode(' '));
      });
      if(reduce){el.classList.add('mr-blur-ready');return;}
      const observer=new IntersectionObserver(([entry])=>{
        if(!entry.isIntersecting)return;
        el.classList.add('mr-blur-active');
        observer.disconnect();
      },{threshold:Number(el.dataset.blurThreshold||.1),rootMargin:el.dataset.blurRootMargin||'0px'});
      observer.observe(el);
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
