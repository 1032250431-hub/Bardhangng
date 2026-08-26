(()=>{
const boot=()=>{
if(!matchMedia('(pointer:coarse)').matches)return;
document.documentElement.classList.add('mobile-perf');
const css=document.createElement('style');css.textContent=`
.mobile-perf .grain,.mobile-perf body:after{display:none!important}
.mobile-perf .mapbg{display:none!important}
.mobile-perf .wash{background:linear-gradient(180deg,#05090cf2 0%,#05090caa 48%,#05090cf8 100%)!important}
.mobile-perf .leaflet-pane{filter:none!important}
.mobile-perf .hero{min-height:auto;padding-bottom:55px}
.mobile-perf .hero h1{letter-spacing:-.065em}
.mobile-perf .section,.mobile-perf .command{content-visibility:auto;contain-intrinsic-size:700px}
.mobile-perf .heroHUD{backdrop-filter:none!important}
.mobile-perf .panel,.mobile-perf .shell,.mobile-perf .top{backdrop-filter:none!important}
.mobile-perf .mr-spotlight,.mobile-perf .mr-cursor,.mobile-perf .mr-cursor-dot{display:none!important}
.mobile-perf .mr-progress{height:1px}
.mobile-perf .signal b{animation-duration:2.8s}
@media(max-width:560px){.mobile-perf .hero h1{font-size:clamp(52px,16vw,82px)}.mobile-perf .hero p{font-size:13px}.mobile-perf .command{padding:45px 8px 55px}.mobile-perf .cmdhead{padding:0 12px}.mobile-perf .cmdhead>div:last-child{display:none}.mobile-perf .grid{min-height:0}.mobile-perf .mapwork{min-height:52vh}.mobile-perf .panel{min-height:0}.mobile-perf .block{padding:14px}.mobile-perf .timeline{min-height:210px}.mobile-perf .hospitals{max-height:240px}.mobile-perf .footer{padding:35px 6vw 50px}}
`;document.head.appendChild(css);
const fastLoader=()=>{const loader=document.querySelector('.mr-loader');if(loader){loader.style.transition='opacity .18s';setTimeout(()=>{loader.style.opacity='0';setTimeout(()=>loader.remove(),220)},350)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fastLoader,{once:true});else fastLoader();
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
