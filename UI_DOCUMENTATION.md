# ResQAI – Autonomous Multi-Agent Disaster Intelligence Platform
## Comprehensive UI/UX Design System & Implementation Documentation

This document provides a single-point reference for the entire frontend user interface, layout architecture, styling configurations, reusable components, and dashboard schemas implemented for **ResQAI**.

---

## 🎨 1. Core Design System & Aesthetic Principles

The frontend replication is styled after elite, high-density aerospace HUDs and emergency mission control interfaces (e.g., *Palantir Gotham, Tesla Mission Control, Vercel, and Apple Design*).

### A. Color Palette (Dark-Mode Locked)
All components share a strict Tailwind-configured color scheme defined in [globals.css](file:///c:/Users/urstr/ResQAi/ResQAI/frontend/app/globals.css):
*   **Background (Canvas)**: `#09090B` (Sleek deep zinc/black)
*   **Surface (Panels & Cards)**: `#16181D` (Subtle deep-grey slate)
*   **Borders**: `#2A2D34` (Refined contrast dividing lines)
*   **Primary Accent**: `#F5B301` (Amber Gold; highlights alerts and controls)
*   **Telemetry Statuses**:
    *   *Success (Nominal)*: `#10B981` (Emerald Green)
    *   *Warning (Caution)*: `#F59E0B` (Amber Orange)
    *   *Danger (Critical)*: `#EF4444` (Distress Red)
    *   *Information (Mesh)*: `#3B82F6` (Operational Blue)

### B. Typography & Grids
*   **Font Sans**: `'Inter', system-ui, -apple-system, sans-serif` (High readability, modern tracking).
*   **Font Mono**: Monospace font families for coordinates, latency clocks, system loads, and telemetry tags.
*   **Fine Grid Scan**: A CSS grid overlay creates a subtle matrix texture (`grid-bg`) using linear gradients and radial dots backgrounds (`dots-bg`), replicating radar scan screens.

### C. Visual Effects & Glassmorphism
*   `glass-panel`: Applying `backdrop-filter: blur(12px)` and semi-transparent border lines (`rgba(42, 45, 52, 0.5)`).
*   `text-glow-[color]`: Drop-shadow neon text glow effects to draw the eye to critical warnings.

---

## ⚙️ 2. Reusable Component Catalog

All components are built modularly and are highly reusable:

### A. Navbar (`components/Navbar.tsx`)
The top control banner managing session modes:
*   **Tactical Header**: Displays active role mode (e.g., GOVERNMENT MODE).
*   **System Telemetry Indicators**: Real-time mock tickers displaying CPU Load, Mesh Network Latency, and Active AI Agent counts.
*   **Alarm Panel**: A dropdown alert drawer displaying active, prioritized, time-stamped incident updates.
*   **Session Handler**: Provides connection heartbeat clock and disconnect routing.

### B. Sidebar (`components/Sidebar.tsx`)
A sliding command controller on the left side:
*   Collapsible toggling between a slim icon grid (16vw) and a text descriptions layout (64vw).
*   Active state tracking that applies custom theme colors depending on the active role dashboard (Gold for Gov, Green for Citizen, Blue for NGO, White for Admin).

### C. StatCard (`components/StatCard.tsx`)
A vital telemetry panel mapping numeric values:
*   **Trend Vectors**: Shows directional shift indicators (Arrow Up/Down/Minus) with context descriptors.
*   **Mini Sparkline**: Automatically calculates a vector SVG path based on input arrays to draw a clean, animated trend graph under the value.
*   **Alert Status**: Glows green, red, or orange depending on criticality.

### D. ChartCard (`components/ChartCard.tsx`)
A custom, vector-based SVG area and bar chart component:
*   **SSR & React 19 Compatible**: Built using raw SVGs, completely bypassing external chart library bundle sizes and execution locks.
*   **Interactive Tooltip**: Tracking mouse movements across vertical coordinate grids to dynamically calculate and render a floating tooltip showing values at specific index times.

### E. MapWidget (`components/MapWidget.tsx`)
The tactical coordinate GIS map screen:
*   **Coordinate Radar Sweeps**: A conic-gradient overlay rotating in a circular loop.
*   **Interactive Overlays**: Tabs to toggle between:
    *   *Radar Scan*: Compass sweep and contour loops.
    *   *Thermal Sensor*: Floating danger heatmap circles.
    *   *Mesh Network*: Connected node vectors tracing drone paths.
*   **Drifting Swarms**: GPS nodes (Wildfires, Drones, Shelters) with simulated drone coordinate movement.
*   **Inspection Dock**: Clicking a node locks in the telemetry profile (capacity, battery, altitude) in the footer.

### F. AgentPanel (`components/AgentPanel.tsx`)
AI orchestration deck:
*   Displays active agents (Recon Drone, Logistics, Medical Dispatcher) and their LLM base models (Claude 3.5, Llama 3, GPT-4o).
*   **Live stdout Terminal**: A simulated terminal window scrolling through real-time agent execution print logs.
*   **Operation Toggles**: Pause/play triggers to simulate manual overrides.

### G. Timeline (`components/Timeline.tsx`)
A vertical dispatch event log mapping notifications with visual bullet points, color-coded urgency tags, and specific coordinating agencies.

---

## 🖥️ 3. Implemented Routes & Views

### 🔑 A. Login Screen (`app/page.tsx`)
*   **Role Cards**: Includes Government (🏛), Citizen (👤), NGO (❤️), and Admin (⚙) role selection cards. Hovering or selecting a card lights up its borders with specific neon glows.
*   **Interactive Login**: Submitting coordinates and security passes triggers an animated handshaking loader and routes the browser to the selected dashboard.

### 🏛 B. Government Operations Dashboard (`app/government/page.tsx`)
The flagship Command Center view:
*   Aggregates 4 StatCards (Fire outbreaks, evacuation status, uav fleets, relief channels).
*   Combines the large GIS MapWidget, the AI Agent coordination deck, the dispatch timeline, and analytics area charts in a high-density viewport layout.

### 👤 C. Citizen Distress Hub (`app/citizen/page.tsx`)
A mobile-first optimized layout for civilians in crisis:
*   **Animated SOS Button**: A prominent glowing distress button. Clicking it starts an automated 5-second countdown with a "Cancel Broadcast" option. Upon expiration, it triggers drone dispatches and locks GPS coordinates.
*   **Local Reports Form**: Lets users submit local alerts (Category, descriptions) which are appended to a pending ticket status stream.
*   **Shelter Capacity Ticker**: Displays distances and load metrics of local evacuation points.

### ❤️ D. NGO Logistics Deck (`app/ngo/page.tsx`)
A cargo, delivery, and volunteer registry deck:
*   **Inventory Gages**: Progress bars mapping warehouse volumes (food rations, water liters, triage kits) with caution triggers.
*   **Dispatch Tracking**: Custom maps showing supply truck path vectors, cargo load capacities, ETAs, and en-route percentages.

### ⚙ E. Admin Settings Control (`app/admin/page.tsx`)
System configurations deck:
*   Diagnostic readouts monitoring system uptime index, database cache latency, and concurrency.
*   **Token Router**: Selectors to dynamically switch active LLM models supporting each subsystem (e.g. swapping Government command core from Qwen-2.5 to Claude-3.5).
*   **System Audit Stream**: Live ticker logging operator authentications, IP checks, and replica sync logs.

---

## 🛠 4. Run & Preview Configurations

### Commands
*   **Launch Development Server**: Exposes port 3000.
    ```bash
    npm run dev
    ```
*   **Compile Production Check**: Verifies linting and TypeScript compilation.
    ```bash
    npm run build
    ```

---
*ResQAI Emergency Management Operating System — Secure Terminal*
