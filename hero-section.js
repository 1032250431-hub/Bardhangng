(function () {
  'use strict';

  /**
   * MED-ROUTE HERO / TACTICAL DIRECTOR LAYER
   * Presentation-only enhancement layer. It does not touch routing, GeoJSON,
   * Leaflet state, dispatch state, or the authoritative engine.
   */
  const CONFIG = {
    heroSelector: '.hero',
    headingSelector: '.hero h1',
    mapSelector: '#heroMap',
    targetScrollSelector: '.command, #commandCenter, [data-command-center]'
  };

  const state = {
    mounted: false,
    raf: 0,
    fps: 60,
    fpsFrames: 0,
    fpsWindowStart: performance.now(),
    latency: 14,
    stress: 50000,
    stressTarget: 50000,
    stressHistory: Array.from({ length: 28 }, (_, i) => 0.35 + Math.sin(i * 0.7) * 0.12),
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    rings: [],
    particles: []
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function injectStyles() {
    if (document.getElementById('mr-hero-director-styles')) return;
    const style = document.createElement('style');
    style.id = 'mr-hero-director-styles';
    style.textContent = `
      .mr-hero-stage{position:relative;isolation:isolate}
      .mr-hero-stage>.mr-hero-spotlight{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0;transition:opacity .35s ease;background:radial-gradient(400px circle at var(--mx,50%) var(--my,50%),rgba(20,184,166,.15),transparent 80%)}
      .mr-hero-stage.mr-pointer-live>.mr-hero-spotlight{opacity:1}
      .mr-hero-stage .mr-hero-heading{opacity:1;visibility:visible;transform:none;will-change:opacity,transform}
      .mr-hero-annotations{position:absolute;inset:-18px -22px -18px -22px;pointer-events:none;z-index:2}
      .mr-hero-pin{position:absolute;display:flex;align-items:center;gap:7px;color:#5d7779;font:7px/1 'IBM Plex Mono',monospace;letter-spacing:.12em;white-space:nowrap}
      .mr-hero-pin:before{content:'';width:10px;height:10px;border:1px solid rgba(97,231,225,.6);background:rgba(97,231,225,.04);box-shadow:inset 0 0 0 2px #05090c}
      .mr-hero-pin:after{content:'';position:absolute;width:20px;height:1px;background:rgba(97,231,225,.22)}
      .mr-hero-pin-a{left:0;top:4%}.mr-hero-pin-a:after{left:11px;top:50%;transform:translateX(-100%)}
      .mr-hero-pin-b{right:0;bottom:8%;flex-direction:row-reverse}.mr-hero-pin-b:after{right:11px;top:50%;transform:translateX(100%)}
      .mr-hero-pin-c{right:8%;top:38%;color:#485e60}.mr-hero-pin-c:before{border-radius:50%}
      .mr-hero-mapfx{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
      .mr-hero-mapfx svg{width:100%;height:100%;display:block;overflow:visible}
      .mr-route-path{fill:none;stroke:rgba(97,231,225,.55);stroke-width:1.25;stroke-dasharray:3 8;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 5px rgba(97,231,225,.75))}
      .mr-route-path.hot{stroke:rgba(255,100,114,.52)}
      .mr-route-dot{fill:#61e7e1;filter:drop-shadow(0 0 5px #61e7e1)}.mr-route-dot.hot{fill:#ff6472;filter:drop-shadow(0 0 6px #ff6472)}
      .mr-radar-ring{fill:none;stroke:rgba(97,231,225,.58);stroke-width:1;vector-effect:non-scaling-stroke;transform-box:fill-box;transform-origin:center;opacity:0}
      .mr-map-node{fill:#61e7e1;opacity:.85;filter:drop-shadow(0 0 6px #61e7e1)}
      .mr-hero-telemetry{position:absolute;right:7vw;top:92px;z-index:8;display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(224,246,244,.1);background:rgba(3,4,7,.58);backdrop-filter:blur(14px);color:#789092;font:7px/1 'IBM Plex Mono',monospace;letter-spacing:.13em;box-shadow:inset 0 1px rgba(255,255,255,.05)}
      .mr-telemetry-online{color:#baf36d}.mr-telemetry-sep{opacity:.25}.mr-telemetry-value{color:#d8e8e6;min-width:35px;text-align:right}
      .mr-stress-card{position:fixed;z-index:21;right:24px;bottom:24px;width:285px;padding:13px;border:1px solid rgba(224,246,244,.1);background:rgba(3,4,7,.7);backdrop-filter:blur(18px);box-shadow:inset 0 1px rgba(255,255,255,.06),0 20px 70px rgba(0,0,0,.28)}
      .mr-stress-head{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#5d7476;font:7px/1 'IBM Plex Mono',monospace;letter-spacing:.14em}.mr-stress-live{color:#baf36d}
      .mr-stress-value{margin-top:5px;font:600 27px/.95 'Space Grotesk',sans-serif;letter-spacing:-.06em;color:#edf7f5}.mr-stress-value span{color:#617678;font:8px 'IBM Plex Mono',monospace;letter-spacing:.08em;margin-left:4px}
      .mr-stress-spark{display:block;width:100%;height:34px;margin-top:8px}.mr-stress-meta{display:flex;justify-content:space-between;margin-top:5px;color:#4f6567;font:6px/1 'IBM Plex Mono',monospace}
      .mr-primary{overflow:hidden}.mr-primary .mr-sheen{position:absolute;inset:0 auto 0 -45%;width:40%;transform:skewX(-20deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);transition:transform .65s ease;pointer-events:none}.mr-primary:hover .mr-sheen{transform:translateX(360%) skewX(-20deg)}
      .mr-primary .mr-pulse-ring{position:absolute;inset:-2px;border:1px solid rgba(97,231,225,.42);border-radius:inherit;pointer-events:none;opacity:.55}.mr-primary:hover .mr-pulse-ring{animation:mrPulseRing 1.25s ease-out infinite}
      @keyframes mrPulseRing{0%{transform:scale(1);opacity:.55}100%{transform:scale(1.08);opacity:0}}
      .mr-primary:active{transform:translateY(0) scale(.95)!important}.mr-secondary .mr-arrow{display:inline-block;margin-left:5px;animation:mrArrowFloat 1.5s ease-in-out infinite}@keyframes mrArrowFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
      @media(max-width:900px){.mr-hero-telemetry{right:6vw;top:82px}.mr-stress-card{right:16px;bottom:16px;width:min(285px,calc(100vw - 32px))}.mr-hero-pin-c{right:0}}
      @media(max-width:639px){.mr-hero-stage .mr-hero-heading{font-size:clamp(2.25rem,13vw,4rem)!important;line-height:.92!important;letter-spacing:-.07em!important;max-width:calc(100vw - 12vw)!important}.mr-hero-annotations{inset:-12px -10px}.mr-hero-pin{font-size:6px}.mr-hero-pin-c{display:none}.mr-hero-telemetry{right:6vw;top:74px;transform:scale(.9);transform-origin:top right}.mr-stress-card{width:calc(100vw - 32px)}}
      @media(prefers-reduced-motion:reduce){.mr-hero-stage>.mr-hero-spotlight{transition:none}.mr-hero-stage .mr-hero-heading{opacity:1!important;transform:none!important}.mr-primary .mr-sheen,.mr-primary .mr-pulse-ring,.mr-secondary .mr-arrow{animation:none!important;transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function hardenHeading(hero) {
    const heading = qs(CONFIG.headingSelector, hero);
    if (!heading) return;
    heading.classList.add('mr-hero-heading');
    heading.classList.remove('opacity-0', 'invisible');
    heading.removeAttribute('hidden');
    heading.style.setProperty('opacity', '1', 'important');
    heading.style.setProperty('visibility', 'visible', 'important');
    heading.style.removeProperty('display');
    heading.style.removeProperty('transform');

    const observer = new MutationObserver(() => {
      heading.classList.remove('opacity-0', 'invisible');
      heading.removeAttribute('hidden');
      if (!heading.style.opacity) heading.style.setProperty('opacity', '1', 'important');
      heading.style.setProperty('visibility', 'visible', 'important');
    });
    observer.observe(heading, { attributes:true, attributeFilter:['class','hidden'] });

    if (state.reducedMotion || !window.gsap) return;
    let revealed = false;
    const reveal = () => {
      if (revealed || !document.documentElement.contains(heading)) return;
      revealed = true;
      heading.style.removeProperty('opacity');
      try {
        window.gsap.fromTo(heading,{opacity:0,y:30},{opacity:1,y:0,duration:.8,ease:'power3.out',clearProps:'transform',onComplete:()=>{
          heading.style.setProperty('opacity','1','important');
          heading.style.setProperty('visibility','visible','important');
        }});
      } catch (_) {
        heading.style.setProperty('opacity','1','important');
        heading.style.setProperty('visibility','visible','important');
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(reveal));
    window.setTimeout(() => {
      if (!revealed) {
        heading.style.setProperty('opacity','1','important');
        heading.style.setProperty('visibility','visible','important');
        heading.style.setProperty('transform','translateY(0)','important');
      }
    },150);
  }

  function addSpotlight(hero) {
    if (qs('.mr-hero-spotlight', hero)) return;
    const layer=document.createElement('div');layer.className='mr-hero-spotlight';hero.prepend(layer);
    hero.addEventListener('pointermove',(event)=>{const rect=hero.getBoundingClientRect();hero.style.setProperty('--mx',`${event.clientX-rect.left}px`);hero.style.setProperty('--my',`${event.clientY-rect.top}px`);hero.classList.add('mr-pointer-live')},{passive:true});
    hero.addEventListener('pointerleave',()=>hero.classList.remove('mr-pointer-live'),{passive:true});
  }

  function addAnnotations(hero) {
    if (qs('.mr-hero-annotations',hero)) return;
    const box=document.createElement('div');box.className='mr-hero-annotations';box.innerHTML='<span class="mr-hero-pin mr-hero-pin-a">[NODE_ID: THN-09]</span><span class="mr-hero-pin mr-hero-pin-b">[SYS_STATUS: OPTIMAL]</span><span class="mr-hero-pin mr-hero-pin-c">[LINK: 18ms]</span>';hero.appendChild(box);
  }

  function addTelemetry(hero) {
    if (qs('.mr-hero-telemetry',hero)) return;
    const hud=document.createElement('div');hud.className='mr-hero-telemetry';hud.innerHTML='<span class="mr-telemetry-online">ENGINE ONLINE</span><span class="mr-telemetry-sep">|</span><span>FPS</span><strong id="mrHeroFps" class="mr-telemetry-value">60</strong><span class="mr-telemetry-sep">|</span><span>LAT</span><strong id="mrHeroLat" class="mr-telemetry-value">14ms</strong>';hero.appendChild(hud);
  }

  function addStressCard() {
    if (qs('.mr-stress-card')) return;
    const card=document.createElement('aside');card.className='mr-stress-card';card.setAttribute('aria-label','Live stress test telemetry');
    card.innerHTML='<div class="mr-stress-head"><span>50K / 200K STRESS TEST</span><span class="mr-stress-live">● LIVE</span></div><div class="mr-stress-value"><span id="mrStressValue">50,000</span><span>/ 200K</span></div><svg class="mr-stress-spark" viewBox="0 0 280 34" preserveAspectRatio="none" aria-hidden="true"><polyline id="mrStressSpark" fill="none" stroke="#61e7e1" stroke-width="1.25" points="0,24 12,22 24,25 36,18 48,20 60,14 72,17 84,11 96,15 108,12 120,16 132,9 144,13 156,10 168,14 180,8 192,12 204,7 216,10 228,6 240,9 252,5 264,8 280,4"/></svg><div class="mr-stress-meta"><span>THROUGHPUT</span><span id="mrStressLatency">14ms</span></div>';
    document.body.appendChild(card);
  }

  function createMapFx(hero) {
    const map=qs(CONFIG.mapSelector);if(!map||qs('.mr-hero-mapfx',hero))return;
    const fx=document.createElement('div');fx.className='mr-hero-mapfx';fx.innerHTML='<svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="mrGlow"><feGaussianBlur stdDeviation="2.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g class="mr-route-layer"><path class="mr-route-path" d="M120 470 C230 390 270 330 395 350 S600 460 735 325 S850 205 925 150"/><path class="mr-route-path hot" d="M75 220 C220 255 305 205 410 245 S610 290 760 210 S880 185 955 270"/><path class="mr-route-path" d="M210 110 C300 175 350 120 465 175 S650 225 810 115"/></g><g class="mr-route-particles"></g><g class="mr-radar-layer"><circle class="mr-map-node" cx="395" cy="350" r="3"/><circle class="mr-map-node" cx="735" cy="325" r="3"/><circle class="mr-map-node" cx="410" cy="245" r="3"/><circle class="mr-map-node" cx="760" cy="210" r="3"/></g></svg>';
    map.appendChild(fx);
    const paths=qsa('.mr-route-path',fx),particleGroup=qs('.mr-route-particles',fx);
    paths.forEach((path,pathIndex)=>{const particles=[];for(let i=0;i<4;i+=1){const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('r',pathIndex===1?'2.4':'2');circle.setAttribute('class',`mr-route-dot${pathIndex===1?' hot':''}`);particleGroup.appendChild(circle);particles.push({node:circle,offset:i/4,speed:.000045+i*.000006});}state.particles.push({path,particles});});
    const radarGroup=qs('.mr-radar-layer',fx);[[395,350],[735,325],[410,245],[760,210]].forEach(([cx,cy],index)=>{for(let r=0;r<2;r+=1){const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');ring.setAttribute('class','mr-radar-ring');ring.setAttribute('cx',cx);ring.setAttribute('cy',cy);ring.setAttribute('r',9+r*7);radarGroup.appendChild(ring);state.rings.push({node:ring,start:performance.now()+index*750+r*150,period:3600+index*140});}});
  }

  function updateSparkline(){const spark=qs('#mrStressSpark');if(!spark)return;state.stressHistory.push(.3+Math.random()*.65);state.stressHistory=state.stressHistory.slice(-28);spark.setAttribute('points',state.stressHistory.map((v,i)=>`${(i/27)*280},${31-v*25}`).join(' '));}

  function tickTelemetry(now){
    state.fpsFrames+=1;
    if(now-state.fpsWindowStart>=500){
      state.fps=Math.max(0,Math.min(120,Math.round((state.fpsFrames*1000)/(now-state.fpsWindowStart))));state.fpsFrames=0;state.fpsWindowStart=now;state.latency=12+Math.floor(Math.random()*7);
      const fpsNode=qs('#mrHeroFps'),latNode=qs('#mrHeroLat'),stressLat=qs('#mrStressLatency');if(fpsNode)fpsNode.textContent=String(state.fps);if(latNode)latNode.textContent=`${state.latency}ms`;if(stressLat)stressLat.textContent=`${state.latency}ms`;
      state.stressTarget=Math.min(200000,Math.max(50000,state.stressTarget+Math.round((Math.random()-.35)*850)));state.stress+=(state.stressTarget-state.stress)*.2;const stressNode=qs('#mrStressValue');if(stressNode)stressNode.textContent=Math.round(state.stress).toLocaleString('en-US');updateSparkline();
    }
  }

  function animateMap(now){if(state.reducedMotion)return;state.particles.forEach(({path,particles})=>{const total=path.getTotalLength();particles.forEach(p=>{const progress=((now*p.speed+p.offset)%1),point=path.getPointAtLength(progress*total);p.node.setAttribute('cx',point.x);p.node.setAttribute('cy',point.y);});});state.rings.forEach(r=>{const p=Math.max(0,Math.min(1,((now-r.start)%r.period)/r.period)),eased=1-Math.pow(1-p,3);r.node.setAttribute('r',String(9+eased*35));r.node.style.opacity=String(.6*(1-p));});}
  function loop(now){state.raf=requestAnimationFrame(loop);tickTelemetry(now);animateMap(now)}

  function wireButtons(hero){
    const primary=qs('.primary',hero);if(primary){primary.classList.add('mr-primary');if(!qs('.mr-sheen',primary))primary.insertAdjacentHTML('beforeend','<span class="mr-sheen" aria-hidden="true"></span><span class="mr-pulse-ring" aria-hidden="true"></span>');}
    const secondary=qs('.secondary',hero);if(secondary){secondary.classList.add('mr-secondary');if(!qs('.mr-arrow',secondary))secondary.insertAdjacentHTML('beforeend',' <span class="mr-arrow" aria-hidden="true">↓</span>');secondary.addEventListener('click',(event)=>{const target=qs(CONFIG.targetScrollSelector);if(!target)return;event.preventDefault();target.scrollIntoView({behavior:state.reducedMotion?'auto':'smooth',block:'start'});});}
  }

  function refreshLayout(){window.setTimeout(()=>{try{window.ScrollTrigger?.refresh()}catch(_){}try{window.gsap?.ScrollTrigger?.refresh()}catch(_){}},120)}

  function mount(){
    if(state.mounted)return;const hero=qs(CONFIG.heroSelector);if(!hero)return;state.mounted=true;hero.classList.add('mr-hero-stage');injectStyles();hardenHeading(hero);addSpotlight(hero);addAnnotations(hero);addTelemetry(hero);addStressCard();createMapFx(hero);wireButtons(hero);refreshLayout();state.raf=requestAnimationFrame(loop);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.addEventListener('pagehide',()=>{if(state.raf)cancelAnimationFrame(state.raf)},{passive:true});
})();
