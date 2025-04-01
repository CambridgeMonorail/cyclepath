Simplifying Road Network Building

In our Three.js driving game, we should streamlined road creation by reducing it to a small set of reusable building blocks. A key principle is that the entire road network is laid out flat on the XZ plane, with all tiles remaining level in 3D space. This ensures consistency and predictability when building and navigating the scene.

🛣️ Laying Roads Flat on the XZ Plane
All road tiles are positioned and rotated in 3D space such that:

They are perfectly flat – no tilts, slopes or banking

They lie on the XZ plane – like a ground surface

They only rotate around the Y axis – to represent turns or changes in direction

This constraint keeps visual alignment clean and avoids issues with floating-point inaccuracies or tile misalignment over time.

🧱 Four Reusable Road Sections
We use just four reusable tile types to represent any road network:

Straight – Continues in the current direction

Curve – Turns 90° left or right

T-Junction – Three-way branching

Crossroads – Full four-way intersection

Each tile has a consistent footprint and height, and can be reused at any point in the layout with only Y-axis rotation to adjust its orientation.

🗺️ Describing Layouts as a 2D Array
Rather than manually positioning each tile in 3D space, we define the road layout using a simple 2D array of instructions. Each entry describes the type of tile and any directional properties (like turning).

Example:

js
Copy
Edit
const layout = [
  { type: 'straight' },
  { type: 'curve', turn: 1 },
  { type: 'straight' },
  { type: 'tjunction', turn: -1 },
  { type: 'curve', turn: -1 },
  { type: 'straight' },
  { type: 'cross' },
  { type: 'straight' },
];
This abstraction makes it easy to load or generate layouts and reason about the structure of the road network without working in raw 3D coordinates.

🧭 From Layout to Scene
The rendering system processes the layout array by:

Starting at an origin point and initial facing direction

Iterating through the tile definitions

Placing each tile on the XZ plane with a Y-axis rotation based on entry and exit direction

Updating position and direction for the next tile

This guarantees that each section lines up cleanly, stays flat, and maintains correct orientation for turns and junctions.

🎯 Benefits
Flat, grid-aligned layout ensures visual and gameplay consistency

Only four tile types needed to represent any road structure

Simple 2D array drives the entire road-building process

Y-axis-only rotation keeps all tiles grounded and easy to reason about

Reusable components improve performance and maintainability
