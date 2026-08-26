# Rural Healthcare Routing — CodeRush 2026

Interactive rural healthcare routing simulation for doctor, ambulance, hospital-bed and medicine allocation.

## Current prototype

- 500-node weighted graph
- Binary min-heap priority queue
- Dijkstra shortest-path routing
- Specialty + bed + medicine feasibility checks
- Ambulance allocation
- Hospital resource mutation after successful dispatch
- Decision telemetry
- Leaflet map visualization
- GSAP interface motion

## Run

Open `index.html` in a browser. The prototype uses CDN-hosted Tailwind CSS, Leaflet and GSAP.

## Algorithm

Dijkstra uses an array-backed binary min heap. Queue insertion and removal are O(log V), giving a shortest-path complexity of O((V + E) log V) for the generated graph.

## Competition goal

The prototype is being evolved into a presentation-ready command center with live dispatch animation, resource telemetry, route decision transparency, dynamic road closures and resilience testing.
