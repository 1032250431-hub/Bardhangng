(function () {
  'use strict';

  /*
   * MED-ROUTE hero presentation layer.
   * The hero heading is owned by this layer only; no secondary text/strand
   * renderer is allowed to paint over it.
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
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  };

  const qs = (selector, root = document) => root.querySelector(selector);

  function injectStyles() {
    if (document.getElementById('mr-hero-director-styles')) return;
    const style = document.createElement('style');
    style.id = 'mr-hero-director-styles';
    style.textContent = `
      .mr-hero-stage{position:relative;isolation:isolate}
      .mr-hero-stage>.mr-hero-spotlight{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0;transition:opacity .35s ease;background:radial-gradient(400px circle at var(--mx,50%) var(--my,50%),rgba(20,184,166,.15),transparent 80%)}
      .mr-hero-stage.mr-pointer-live>.mr-hero-spotlight{opacity:1}
      .mr-hero-stage .mr-hero-heading{opacity:1;visibility:visible;transform:none}
      .mr-hero-annotations{position:absolute;inset:-18px -22px -18px -22px;pointer-events:none;z-index:2}
      .mr-hero-pin{position:absolute;display:flex;align-items:center;gap:7px;color:#5d7779;font:7px/1 'IBM Plex Mono',monospace;letter-spacing:.12em;white-space:nowrap}
      .mr-hero-pin:before{content:'';width:10px;height:10px;border:1px solid rgba(97,231,225,.6);background:rgba(97,231,225,.04);box-shadow:inset 0 0 0 2px #05090c}
      .mr-hero-pin:after{content:'';position:absolute;width:20px;height:1px;background:rgba(97,231,225,.22)}
      .mr-hero-pin-a{left:0;top:4%}.mr-hero-pin-a:after{left:11px;top:50%;transform:translateX(-100%)}
      .mr-hero-pin-b{right:0;bottom:8%;flex-direction:row-reverse}.mr-hero-pin-b:after{right:11px;top:50%;transform:translateX(100%)}
      .mr-hero-pin-c{right:8%;top:38%;color:#485e60}.mr-hero-pin-c:before{border-radius:50%}
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
      @media(max-width:900px){
        .mr-hero-telemetry{right:6vw;top:82px}
        .mr-stress-card{right:16px;bottom:16px;width:min(285px,calc(100vw - 32px))}
        .mr-hero-pin-a,.mr-hero-pin-b,.mr-hero-pin-c{display:none!important}
      }
      @media(max-width:639px){
        .mr-hero-stage .mr-hero-heading{font-size:clamp(2.25rem,13vw,4rem)!important;line-height:.92!important;letter-spacing:-.07em!important;max-width:calc(100vw - 12vw)!important}
        .mr-hero-annotations{display:none!important}
        .mr-hero-telemetry{right:6vw;top:74px;transform:scale(.9);transform-origin:top right}
        .mr-stress-card{width:calc(100vw - 32px)}
      }
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
      heading.style.setProperty('opacity', '1', 'important');
      heading.style.setProperty('visibility', 'visible', 'important');
    });
    observer.observe(heading, { attributes:true, attributeFilter:['class','hidden'] });

    if (state.reducedMotion || !window.gsap) return;
    let revealed = false;
    const reveal = () => {
      if (revealed || !document.documentElement.contains(heading)) return;
      revealed = true;
      try {
        window.gsap.fromTo(heading,{opacity:0,y:30},{opacity:1,y:0,duration:.8,ease:'power3.out',clearProps:'transform',onComplete:()=>{
          heading.style.setProperty('opacity','1','important');
          heading.style.setProperty('visibility','visible','important');
        }});
      } catch (_) {
        heading.style.setProperty('opacity','1','important');
        heading.style.setProperty('visibility','visible','important');
        heading.style.setProperty('transform','translateY(0)','important');
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
    hero.addEventListener('pointermove',(event)=>{
      const rect=hero.getBoundingClientRect();
      hero.style.setProperty('--mx',`${event.clientX-rect.left}px`);
      hero.style.setProperty('--my',`${event.clientY-rect.top}px`);
      hero.classList.add('mr-pointer-live');
    },{passive:true});
    hero.addEventListener('pointerleave',()=>hero.classList.remove('mr-pointer-live'),{passive:true});
  }

  function addAnnotations(hero) {
    if (qs('.mr-hero-annotations',hero)) return;
    const box=document.createElement('div');
    box.className='mr-hero-annotations';
    box.innerHTML='<span class="mr-hero-pin mr-hero-pin-a">[NODE_ID: THN-09]</span><span class="mr-hero-pin mr-hero-pin-b">[SYS_STATUS: OPTIMAL]</span><span class="mr-hero-pin mr-hero-pin-c">[LINK: 18ms]</span>';
    hero.appendChild(box);
  }

  function addTelemetry(hero) {
    if (qs('.mr-hero-telemetry',hero)) return;
    const hud=document.createElement('div');
    hud.className='mr-hero-telemetry';
    hud.innerHTML='<span class="mr-telemetry-online">ENGINE ONLINE</span><span class="mr-telemetry-sep">|</span><span>FPS</span><strong id="mrHeroFps" class="mr-telemetry-value">60</strong><span class="mr-telemetry-sep">|</span><span>LAT</span><strong id="mrHeroLat" class="mr-telemetry-value">14ms</strong>';
    hero.appendChild(hud);
  }

  function addStressCard() {
    if (qs('.mr-stress-card')) return;
    const card=document.createElement('aside');
    card.className='mr-stress-card';
    card.setAttribute('aria-label','Live stress test telemetry');
    card.innerHTML='<div class="mr-stress-head"><span>50K / 200K STRESS TEST</span><span class="mr-stress-live">● LIVE</span></div><div class="mr-stress-value"><span id="mrStressValue">50,000</span><span>/ 200K</span></div><svg class="mr-stress-spark" viewBox="0 0 280 34" preserveAspectRatio="none" aria-hidden="true"><polyline id="mrStressSpark" fill="none" stroke="#61e7e1" stroke-width="1.25" points="0,24 12,22 24,25 36,18 48,20 60,14 72,17 84,11 96,15 108,12 120,16 132,9 144,13 156,10 168,14 180,8 192,12 204,7 216,10 228,6 240,9 252,5 264,8 280,4"/></svg><div class="mr-stress-meta"><span>THROUGHPUT</span><span id="mrStressLatency">14ms</span></div>';
    document.body.appendChild(card);
  }

  function wireCtas(hero) {
    const primary=qs('.mr-primary',hero);
    if(primary&&!qs('.mr-sheen',primary)){
      primary.style.position='relative';
      primary.insertAdjacentHTML('beforeend','<span class="mr-sheen" aria-hidden="true"></span><span class="mr-pulse-ring" aria-hidden="true"></span>');
    }
    const secondary=qs('.mr-secondary',hero);
    if(secondary&&!qs('.mr-arrow',secondary)) secondary.insertAdjacentHTML('beforeend','<span class="mr-arrow" aria-hidden="true">↓</span>');
    if(secondary) secondary.addEventListener('click',()=>qs(CONFIG.targetScrollSelector)?.scrollIntoView({behavior:'smooth',block:'start'}),{passive:false});
  }

  function mount() {
    if(state.mounted)return;
    const hero=qs(CONFIG.heroSelector);
    if(!hero)return;
    state.mounted=true;
    hero.classList.add('mr-hero-stage');
    injectStyles();
    hardenHeading(hero);
    addSpotlight(hero);
    addAnnotations(hero);
    addTelemetry(hero);
    addStressCard();
    wireCtas(hero);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
