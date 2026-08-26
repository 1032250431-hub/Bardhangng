const assert=require('node:assert/strict');
const {MinPriorityQueue,createHealthcareEngine,SPECIALTIES}=require('./core-engine.js');

// Heap ordering / O(log n) structure smoke test.
const q=new MinPriorityQueue();q.enqueue('slow',20);q.enqueue('fast',3);q.enqueue('mid',11);
assert.equal(q.dequeue().value,'fast');
assert.equal(q.dequeue().value,'mid');
assert.equal(q.dequeue().value,'slow');

const engine=createHealthcareEngine();
const village=engine.nodes.find(n=>n.type==='VILLAGE');
assert(village,'graph must contain villages');
assert.equal(engine.nodes.length,500,'graph node count');
assert.equal(engine.hospitals.length,5,'hospital count');
assert.equal(engine.ambulances.length,10,'ambulance count');

// Invalid request must fail safely without mutating resources.
const before=engine.hospitals.map(h=>[h.beds,h.medicine]);
const invalid=engine.processEmergency('NOT-A-NODE','Cardiology');
assert.equal(invalid.success,false);assert.equal(invalid.status,'INVALID_REQUEST');
assert.deepEqual(engine.hospitals.map(h=>[h.beds,h.medicine]),before);

// Successful path/dispatch smoke test. Use a specialty guaranteed to exist at H-1.
const specialty=engine.hospitals[0].specialty[0]||SPECIALTIES[0];
const result=engine.processEmergency(village.id,specialty);
assert.equal(result.success,true,'expected a viable demo dispatch');
assert.equal(result.status,'DISPATCHED');
assert(result.path.length>=2,'route must contain origin and destination');
assert.equal(result.ambulance.status,'DISPATCHED');
assert.equal(result.hospital.beds,before[engine.hospitals.findIndex(h=>h.id===result.hospital.id)][0]-1);
assert.equal(result.hospital.medicine,before[engine.hospitals.findIndex(h=>h.id===result.hospital.id)][1]-1);

// Fleet exhaustion edge case.
engine.ambulances.forEach(a=>a.status='DISPATCHED');
const exhausted=engine.processEmergency(village.id,specialty);
assert.equal(exhausted.success,false);assert.equal(exhausted.status,'QUEUED_NO_AMBULANCE');

console.log('MED-ROUTE engine smoke tests: PASS');
