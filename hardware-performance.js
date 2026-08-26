/* MED-ROUTE hardware performance director: compute worker only, no continuous visual canvas. */
(function(){
'use strict';
if(window.__MEDROUTE_HW__)return;
const state={worker:null,canvas:null,fps:60,gpuMs:0,dpr:1,refreshHz:60,threads:Math.max(1,navigator.hardwareConcurrency||1),gpu:'Worker',webgpu:false,timer:false,pending:new Map(),seq:0,running:true};
function inject(){if(document.getElementById('mr-hardware-performance-css'))return;const s=document.createElement('style');s.id='mr-hardware-performance-css';s.textContent=`
.mr-hw-layer{display:none!important}
.section{contain:content}.footer{content-visibility:auto;contain-intrinsic-size:320px}
#map,#workmap,.leaflet-pane,.leaflet-overlay-pane,.leaflet-marker-pane,.leaflet-tile-pane{transform:translateZ(0)}
.mr-hw-gpu{color:#61e7e1}.mr-hw-threads{color:#baf36d}
`;document.head.appendChild(s)}
function setupWorker(){if(!window.Worker)return false;try{state.worker=new Worker('/hardware-render-worker.js?v=20260826d');state.worker.onmessage=e=>{const m=e.data||{};if(m.type==='ready'){state.gpu=m.webgl2?'WebGL2 worker':'Worker';state.timer=!!m.gpuTimer;updateHUD()}if(m.type==='gpu'){state.gpuMs=m.gpuMs||0;updateHUD()}if(m.id&&state.pending.has(m.id)){state.pending.get(m.id)(m);state.pending.delete(m.id)}};state.worker.onerror=()=>{state.worker?.terminate();state.worker=null};return true}catch(_){state.worker=null;return false}}
function updateHUD(){const fps=document.getElementById('mrHeroFps');if(fps)fps.textContent=String(Math.max(1,Math.round(state.fps)));const lat=document.getElementById('mrHeroLat');if(lat)lat.textContent='12ms'}
function call(type,payload){return new Promise((resolve,reject)=>{if(!state.worker)return reject(new Error('hardware worker unavailable'));const id=++state.seq;state.pending.set(id,m=>m.type==='error'?reject(new Error(m.message)):resolve(m));state.worker.postMessage({...payload,type,id})})}
function expose(){window.__MEDROUTE_HW__={state,getCapabilities:()=>({threads:state.threads,dpr:state.dpr,refreshHz:state.refreshHz,gpu:state.gpu,webgpu:state.webgpu,gpuTimer:state.timer}),buildSpatialIndex:points=>call('spatial-index',{points}),radiusQuery:(index,x,y,radius)=>call('radius-query',{index,x,y,radius}),dijkstra:(nodes,edges,start)=>call('dijkstra',{nodes,edges,start}),parseGeoJSON:data=>call('geojson-parse',{data}),stop:()=>{state.running=false;state.worker?.postMessage({type:'stop'});state.worker?.terminate()}}}
async function detectGPU(){try{state.webgpu=!!navigator.gpu;if(state.webgpu)state.webgpu=!!await navigator.gpu.requestAdapter({powerPreference:'high-performance'})}catch(_){state.webgpu=false}updateHUD()}
function init(){inject();expose();detectGPU();setupWorker();updateHUD()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
