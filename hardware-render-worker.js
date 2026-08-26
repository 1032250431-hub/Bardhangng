/* MED-ROUTE hardware worker: GPU compositor + off-main-thread data utilities. */
'use strict';

let canvas=null, gl=null, program=null, uTime=null, uResolution=null, uIntensity=null, frameHandle=0, lastTime=0;
let timerExt=null, query=null, gpuMs=0;

const VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.0,1.0);}`;
const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void main(){
  vec2 p=vUv-.5; p.x*=uResolution.x/max(uResolution.y,1.0);
  float angle=atan(p.y,p.x);
  float sweep=pow(max(0.0,cos(angle-uTime*.75)),28.0);
  float gridX=1.0-smoothstep(.0,.018,abs(fract(vUv.x*42.0)-.5));
  float gridY=1.0-smoothstep(.0,.018,abs(fract(vUv.y*24.0)-.5));
  float noise=hash(vUv*uResolution+uTime)*.018;
  float r=length(p);
  float vignette=1.0-smoothstep(.18,.76,r);
  vec3 cyan=vec3(.11,.92,.86);
  vec3 indigo=vec3(.18,.25,.8);
  vec3 c=cyan*(sweep*.11)+indigo*(gridX+gridY)*.004;
  c+=noise;
  float a=(sweep*.075+(gridX+gridY)*.002)*vignette*uIntensity;
  outColor=vec4(c,a);
}`;

function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');return s;}
function initWebGL(){
  if(!canvas)return false;
  gl=canvas.getContext('webgl2',{alpha:true,antialias:false,powerPreference:'high-performance',desynchronized:true,preserveDrawingBuffer:false});
  if(!gl)return false;
  const vs=compile(gl.VERTEX_SHADER,VERTEX),fs=compile(gl.FRAGMENT_SHADER,FRAGMENT);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'program link failed');
  gl.deleteShader(vs);gl.deleteShader(fs);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  uTime=gl.getUniformLocation(program,'uTime');uResolution=gl.getUniformLocation(program,'uResolution');uIntensity=gl.getUniformLocation(program,'uIntensity');
  timerExt=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  return true;
}
function render(now){
  if(!gl||!program)return;
  const dt=Math.min(.1,Math.max(0,(now-lastTime)/1000||0));lastTime=now;
  gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.uniform1f(uTime,now*.001);gl.uniform2f(uResolution,canvas.width,canvas.height);gl.uniform1f(uIntensity,1);
  if(timerExt&&!query){query=gl.createQuery();gl.beginQuery(timerExt.TIME_ELAPSED_EXT,query);gl.drawArrays(gl.TRIANGLES,0,6);gl.endQuery(timerExt.TIME_ELAPSED_EXT)}else gl.drawArrays(gl.TRIANGLES,0,6);
  if(query&&gl.getQuery(query,gl.QUERY_RESULT_AVAILABLE)){const disjoint=gl.getParameter(timerExt.GPU_DISJOINT_EXT);if(!disjoint){gpuMs=Number(gl.getQuery(query,gl.QUERY_RESULT))/1e6;self.postMessage({type:'gpu',gpuMs,dt});}gl.deleteQuery(query);query=null;}
  frameHandle=self.requestAnimationFrame(render);
}
function resize(w,h,dpr){if(!canvas)return;canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));}

function spatialIndex(points){
  const sorted=points.slice().sort((a,b)=>a.x-b.x);
  return {type:'sorted-x',points:sorted};
}
function radiusQuery(index,x,y,r){const pts=index.points,out=[],r2=r*r;let lo=0,hi=pts.length;while(lo<hi){const m=(lo+hi)>>1;if(pts[m].x<x-r)lo=m+1;else hi=m;}for(let i=lo;i<pts.length&&pts[i].x<=x+r;i++){const p=pts[i],dx=p.x-x,dy=p.y-y;if(dx*dx+dy*dy<=r2)out.push(p);}return out;}
function dijkstra(payload){
  const nodes=payload.nodes,edges=payload.edges,start=payload.start;
  const dist=new Map(),prev=new Map(),heap=[];for(const n of nodes)dist.set(n,Infinity);dist.set(start,0);heap.push([0,start]);
  const graph=new Map();for(const n of nodes)graph.set(n,[]);for(const e of edges)graph.get(e.from)?.push(e);
  const push=(v,p)=>{heap.push([p,v]);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const m=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let s=i;if(l<heap.length&&heap[l][0]<heap[s][0])s=l;if(r<heap.length&&heap[r][0]<heap[s][0])s=r;if(s===i)break;[heap[i],heap[s]]=[heap[s],heap[i]];i=s;}}return m;};
  heap.length=0;push(start,0);while(heap.length){const [du,u]=pop();if(du!==dist.get(u))continue;for(const e of graph.get(u)||[]){if(e.blocked)continue;const nd=du+e.travelTime;if(nd<dist.get(e.to)){dist.set(e.to,nd);prev.set(e.to,u);push(e.to,nd);}}}
  const distances={};for(const [k,v] of dist)distances[k]=v;const previous={};for(const [k,v] of prev)previous[k]=v;return {distances,previous};
}
self.onmessage=(event)=>{const m=event.data||{};try{
  if(m.type==='init-canvas'){canvas=m.canvas;resize(m.width,m.height,m.dpr);if(initWebGL()){lastTime=performance.now();frameHandle=self.requestAnimationFrame(render);self.postMessage({type:'ready',webgl2:true,gpuTimer:!!timerExt,threads:1});}else self.postMessage({type:'ready',webgl2:false,gpuTimer:false,threads:1});}
  else if(m.type==='resize')resize(m.width,m.height,m.dpr);
  else if(m.type==='stop'){if(frameHandle)self.cancelAnimationFrame(frameHandle);frameHandle=0;}
  else if(m.type==='spatial-index'){const index=spatialIndex(m.points||[]);self.postMessage({type:'spatial-index-result',id:m.id,points:index.points});}
  else if(m.type==='radius-query'){const index={points:m.index||[]};self.postMessage({type:'radius-result',id:m.id,points:radiusQuery(index,m.x,m.y,m.radius)});}
  else if(m.type==='dijkstra'){self.postMessage({type:'dijkstra-result',id:m.id,result:dijkstra(m)});}
  else if(m.type==='geojson-parse'){const json=typeof m.data==='string'?JSON.parse(m.data):m.data;self.postMessage({type:'geojson-result',id:m.id,count:json?.features?.length||0,data:json});}
}catch(error){self.postMessage({type:'error',id:m.id,message:error instanceof Error?error.message:String(error)});}};
