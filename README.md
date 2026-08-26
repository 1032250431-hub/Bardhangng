# MED-ROUTE — Rural Healthcare Routing

CodeRush 2026 — Problem #04: Doctor, Ambulance & Medicine Routing.

## Live Demo

https://med-route-coderush.onrender.com

## What this solves

MED-ROUTE is an interactive routing and dispatch simulation for rural healthcare networks. It selects a feasible hospital and ambulance while minimizing weighted travel cost plus a low-bed wait penalty, then mutates live hospital and fleet state.

## Algorithm

- Weighted undirected graph with travel-time edge weights.
- Custom array-backed binary `MinPriorityQueue`.
- Dijkstra shortest-path search.
- Hospital feasibility filtering: required specialty, beds > 0 and medicine > 0.
- Composite cost: travel time + wait penalty when beds are critically low.
- Nearest available ambulance selection.
- Dynamic road-block support and rerouting.

Shortest-path complexity: **O((V + E) log V)** with a binary min heap. Priority queue insert/remove are O(log n).

## Scale Lab

The deployed UI includes a real, measured browser stress lab. It generates **50,000 nodes and 200,000 weighted edges**, runs three real Dijkstra searches using a binary heap, and drains **5,000 synthetic emergency queue arrivals**. The benchmark executes inside a Web Worker so the command center remains interactive while the stress graph is built and searched.

Benchmark results are measured on the judge's browser at runtime rather than hard-coded.

## Live UI

The UI is driven by the actual `core-engine.js` implementation — no hard-coded routing result is used. It demonstrates:

- Interactive Leaflet network map.
- Animated Dijkstra route and moving ambulance.
- Hospital bed/medicine telemetry.
- Ambulance fleet state.
- Decision timeline with routing rationale.
- Road closure simulation.
- Real 50k-node / 200k-edge scale benchmark.
- Resource-depletion and fleet-exhaustion edge-case lab.
- Responsive desktop/mobile layout with a reduced mobile rendering budget.

## Edge cases demonstrated

- No feasible specialist/resource combination.
- Hospital with zero beds.
- Hospital with zero medicine.
- All ambulances occupied (`QUEUED_NO_AMBULANCE`).
- Blocked road edges.
- Invalid start/specialty handling in the engine.
- Large graph stress under a separate Web Worker.

## Testing

`npm test` runs engine smoke and edge-case checks. GitHub Actions runs the test suite on pushes and pull requests.

## Architecture

```text
Leaflet + GSAP UI
       |
       v
createHealthcareEngine()
       |
       +-- Binary Min Heap
       +-- Dijkstra
       +-- Hospital feasibility
       +-- Ambulance allocation
       +-- Resource mutation
       +-- Road closures
       |
       v
Route + Telemetry + Decision Log

Scale Lab (Web Worker)
       |
       +-- 50,000 nodes
       +-- 200,000 weighted edges
       +-- 3 real Dijkstra runs
       +-- 5,000 queue arrivals
```

The competition asks for a working application focused on the routing problem rather than a complete hospital-management system; this project therefore keeps the scope centered on routing, allocation, dispatch, resources and resilience.
