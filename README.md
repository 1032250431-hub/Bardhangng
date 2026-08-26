# MED-ROUTE — Rural Healthcare Routing

**CodeRush 2026 — Official Problem #04: Rural Healthcare: The Doctor, Ambulance & Medicine Routing Problem**

## Live Project

- **Live deployment:** https://med-route-coderush.onrender.com
- **Repository:** https://github.com/1032250431-hub/rural-healthcare-routing-coderush

MED-ROUTE is a production-style, browser-based rural emergency routing and dispatch application. It evaluates emergency requests against specialty/doctor availability, hospital capacity, medicine stock, urgency/SLA constraints, road conditions and ambulance availability, then commits the lowest-cost feasible dispatch while exposing the decision trace to the operator.

This is a working application, not a prerecorded UI demo: the command center calls the real routing engine in `core-engine.js`, mutates live state, renders the resulting route, and updates telemetry.

## Technologies Used

### Application / algorithms
- **JavaScript (ES2022+)** — application and routing engine.
- **Node.js 18+** — lightweight production HTTP server and test runner.
- **Custom Binary Min Heap** — array-backed priority queue with O(log n) insertion/removal.
- **Dijkstra's algorithm** — weighted shortest-path routing.
- **Web Workers** — keeps the 50k/200k scale benchmark off the main UI thread.

### UI / visualization
- **HTML5 + CSS3** — responsive command-center interface and motion system.
- **Leaflet 1.9.4** — interactive map, network visualization, route polylines and markers.
- **GSAP 3.12.2** — interface choreography, route/telemetry animation and micro-interactions.
- **Google Fonts (Space Grotesk, IBM Plex Mono, DM Sans)** — typography.

## Third-Party APIs / Services

- **Leaflet** — open-source browser map library used to render the interactive network map.
- **Carto/CartoDB basemap tiles** — dark map tile imagery used as the visual geographic basemap through Leaflet.
- **Google Fonts** — remotely hosted web fonts used by the interface.
- **Render** — production web hosting and deployment service for the live application.
- **GitHub Actions** — automated test execution on repository changes.

No Google Maps API, paid routing API, external hospital database, or proprietary routing service is required by the application. The routing decision itself is computed locally by the project's own graph engine.

## AI Tools Used

- **OpenAI ChatGPT** — engineering/design copilot for architecture, algorithm implementation, testing strategy, UI/UX refinement and debugging.
- **Google Gemini** — additional UI/code ideation and refinement during development.

AI tools assisted development; the submitted repository contains the complete source code required to run the application and the routing engine executes locally in the browser.

## Setup / Run Instructions

### Requirements

- Node.js **18 or newer**.
- A modern Chromium, Firefox or Safari browser.

### Local run

```bash
git clone https://github.com/1032250431-hub/rural-healthcare-routing-coderush.git
cd rural-healthcare-routing-coderush
npm test
npm start
```

Then open `http://localhost:3000`.

The project has no runtime npm dependency installation requirement; `package.json` contains the start/test scripts and the browser loads visualization libraries from their public CDNs.

### Production deployment

The repository's `main` branch is deployed on Render. The server binds to `process.env.PORT` and `0.0.0.0` for Render compatibility.

## Algorithm / Approach

### 1. Weighted graph

The healthcare network is represented as a weighted graph. Nodes represent villages/intersections/hospitals and edges represent roads with travel-time weights. Road edges can be dynamically blocked.

### 2. Priority queue

A custom array-backed binary `MinPriorityQueue` is used instead of sorting an array on every operation.

- Insert: **O(log n)**
- Extract minimum: **O(log n)**
- Peek: **O(1)**

### 3. Dijkstra routing

Dijkstra explores the weighted graph from the emergency origin and reconstructs the lowest-travel-cost path. The hospital decision layer then evaluates whether each candidate is feasible for the request.

Shortest-path complexity with the binary heap: **O((V + E) log V)** time and **O(V + E)** graph storage.

### 4. Healthcare feasibility

A candidate hospital can be rejected when it:

- lacks the requested specialty;
- has no on-duty qualified specialist;
- has `beds === 0`;
- has `medicine === 0`;
- violates the request's urgency/SLA travel window; or
- is unreachable under the current road state.

The decision timeline records these rejection reasons so the result is explainable rather than a black box.

### 5. Composite cost

```text
Composite Cost = Travel Time + Low-Bed Wait Penalty
```

Urgency/SLA constraints are treated as feasibility constraints before a route is committed.

### 6. Ambulance allocation

The engine selects an available ambulance for a successful request and changes its state from `IDLE` to `DISPATCHED`. If the fleet is exhausted, the request is not falsely dispatched and returns:

```text
{
  success: false,
  status: "QUEUED_NO_AMBULANCE",
  reason: "All local ambulances currently occupied."
}
```

### 7. State mutation

On successful dispatch:

- hospital beds decrease by 1;
- hospital medicine decreases by 1;
- selected ambulance becomes `DISPATCHED`;
- medicine preparation is recorded in the queue;
- route and decision telemetry are updated.

### 8. Dynamic roads / rerouting

Blocked edges are represented in graph state and ignored by subsequent path searches. The operator can trigger a road closure and observe the engine recompute a feasible route.

## Testing / Test Cases

Run the automated suite with:

```bash
npm test
```

The test suite covers:

- binary heap ordering;
- graph generation and node/edge structure;
- hospital and ambulance counts;
- invalid origin/specialty handling;
- successful routing and dispatch;
- hospital bed/medicine state mutation;
- ambulance state mutation;
- fleet exhaustion and `QUEUED_NO_AMBULANCE` behavior.

GitHub Actions runs the engine tests on repository changes.

### Live Judge Scenario Deck

The deployed command center includes executable scenario cards that invoke the real engine rather than replaying static log text:

1. **Qualified Hospital Routing** — specialty, doctor, capacity, medicine, SLA and travel-cost evaluation.
2. **Nearest Specialist Unavailable** — removes specialist availability and proves alternative selection.
3. **All Ambulances Occupied** — validates the queue/failure contract without false dispatch.
4. **Hospital Full / Medicine Depleted** — validates resource-feasibility rejection.
5. **Dynamic Road Closure** — blocks a real graph edge and reroutes.
6. **Concurrent Critical Influx** — submits multiple critical requests against shared live resources.

Temporary scenario mutations are restored after each judge case so the command center can be reused.

### Scale / resilience test

The Scale Lab runs a real browser benchmark in a Web Worker:

- **50,000 graph nodes**
- **200,000 weighted road edges**
- multiple real Dijkstra searches using the binary heap
- **5,000 emergency-priority queue arrivals**
- runtime measured in the judge's browser rather than hard-coded

The Web Worker prevents the scale test from blocking the command-center UI.

## User Interface / Demonstration

The command center provides:

- interactive dark network map;
- animated dispatch route and ambulance marker;
- live hospital beds/medicine telemetry;
- live ambulance fleet state;
- structured decision timeline;
- urgency and SLA controls;
- road-closure controls;
- resource/fleet edge-case controls;
- Judge Scenario Deck;
- Scale Lab;
- responsive desktop and mobile layouts with reduced rendering/animation work on smaller devices.

## Repository Structure

```text
core-engine.js          # Graph, binary heap, Dijkstra, dispatch/state engine
test-engine.js          # Automated engine tests
index-final.html        # Production UI
server.js               # Production/local HTTP server
judge-scenarios.js      # Live judge scenario deck
stress-benchmark.js     # Scale benchmark worker/controller
mobile-performance.js   # Mobile rendering/performance layer
visual-refinements.css  # Visual system and responsive refinements
motion-enhancements.js  # UI motion layer
ui-state-fix.js         # UI recovery/telemetry synchronization
final-overrides.js      # Final production UI overrides
.github/workflows/      # CI test workflow
package.json            # Run/test scripts
```

## Submission Notes

The repository is the original project repository and contains the complete source required for the application. Required collaborators are added to the GitHub repository: **Twenitrix**, **AyushRBuilds**, and **InvictusMF**.

The application scope intentionally stays focused on the official routing/allocation/dispatch problem rather than attempting to become a full hospital-management system.
