
# Building a Mario Kart–Style 3D Racing Game with React Three Fiber and Tile‑Based Maps

In this guide, we’ll create a **3D racing game** inspired by Mario Kart using **React**, **Three.js**, and **React Three Fiber (R3F)**. The game world is a modular **tile-based city map** loaded from JSON, with each tile representing a road segment (straight, intersection, T-junction, or dead end). We’ll cover how to render the 3D environment with React Three Fiber and Drei, integrate a physics engine for vehicle movement and collisions, implement basic bike controls, add scenery per tile from configuration, and discuss performance optimisations for desktop and mobile. The guide is structured step-by-step and is designed with scalability in mind.

## Tile-Based City Map System

**Goal:** Create a flexible system to define a city road network using **modular tiles** driven by a JSON configuration. This allows easy editing of track layouts and adding new tile types or scenery elements without changing code.

### Designing Tile Types and Connectivity

First, define the **tile types** that make up the road network. Each tile is a small piece of road (or empty space) that will connect with others on a grid. Common tile types include straight roads, corners, intersections, T-junctions, and dead-ends. It’s important to specify how each tile connects to its neighbors so roads line up correctly (e.g. which edges have road exits). We can use **connectivity flags** or similar to encode this ([Tiled roads - how to update adjacent tiles : r/howdidtheycodeit](https://www.reddit.com/r/howdidtheycodeit/comments/z13cjn/tiled_roads_how_to_update_adjacent_tiles/#:~:text=You%20can%20simplify%20it%20with,code%20you%27ll%20need%20to%20write)). For example, a straight road might connect north–south, a T-junction connects north, east, south, and a dead-end connects only to one side.

Below is a table of typical road tile types and their connections:

| **Tile Type**       | **Description**                  | **Road Connections**        |
|---------------------|----------------------------------|----------------------------|
| **Straight Road**   | Straight road segment (can be placed horizontally or vertically by rotation). | Two opposite sides (e.g. North–South or East–West). |
| **Corner Turn**     | 90° turn (curve) connecting two perpendicular roads. | Two adjacent sides (e.g. North–East). |
| **T-Junction**      | 3-way intersection (road splits into two). | Three sides (e.g. North, East, South; West is closed). |
| **Intersection**    | 4-way intersection (crossroads). | All four sides (North, East, South, West). |
| **Dead End**        | Cul-de-sac / road ending.        | One side only (other sides closed). |

Each tile will be a reusable 3D model or mesh. Ensure that the models are designed so that road segments **align seamlessly** when placed on a grid. For instance, the road should exit the tile exactly at the center of an edge so it connects to a road on the adjacent tile. Using a “connectivity flag” system (inspired by techniques like Wave Function Collapse) can help manage which tile types can neighbor each other ([Tiled roads - how to update adjacent tiles : r/howdidtheycodeit](https://www.reddit.com/r/howdidtheycodeit/comments/z13cjn/tiled_roads_how_to_update_adjacent_tiles/#:~:text=You%20can%20simplify%20it%20with,code%20you%27ll%20need%20to%20write)). For simplicity, we assume the JSON map is pre-designed to have consistent connections.

### JSON Map Configuration

We use a JSON file to describe the layout of the city track. This JSON can list each tile’s type, position on a grid, orientation, and any optional scenery objects on that tile. Here’s an example of a simple map configuration:

```json
{
  "tileSize": 10,
  "tiles": [
    { "x": 0, "y": 0, "type": "intersection" },
    { "x": 1, "y": 0, "type": "road_straight", "rotation": 0 },
    { "x": 2, "y": 0, "type": "road_straight", "rotation": 0 },
    { "x": 3, "y": 0, "type": "T_junction", "rotation": 90,
      "objects": [
        { "type": "traffic_light", "position": [4, 0, 4] },
        { "type": "bin", "position": [-3, 0, 2] }
      ]
    },
    { "x": 3, "y": 1, "type": "road_straight", "rotation": 90 },
    { "x": 3, "y": 2, "type": "dead_end", "rotation": 180 }
  ]
}
```

**Explanation:** In this JSON, each tile entry has grid coordinates `x, y`, a `type` (matching one of our tile models, e.g. “road_straight”, “intersection”, etc.), and a `rotation` (in degrees) to orient the tile. For example, the tile at (3,0) is a T-junction rotated 90° (so its open ends might be north, west, south in world orientation). Tiles can also include an `objects` array for scenery or obstacles on that tile – in this case, the T-junction has a traffic light and a bin placed at certain positions relative to the tile. We define `tileSize` (e.g. 10 units) as the width/depth of each tile so we can position them correctly in world space.

**Loading the JSON:** In your React app, you can load this JSON (e.g. via `fetch` or import it if bundling) and then use it to render the map. For example:

```jsx
// Pseudocode for loading map JSON and rendering tiles
import mapData from './cityMap.json';  // assume it's bundled or loaded

const tileModels = {
  road_straight: useGLTF('/models/road_straight.glb'),
  road_corner: useGLTF('/models/road_corner.glb'),
  T_junction: useGLTF('/models/t_junction.glb'),
  intersection: useGLTF('/models/intersection.glb'),
  dead_end: useGLTF('/models/dead_end.glb'),
  // ... load other needed models
};

return (
  <group name="CityMap">
    {mapData.tiles.map(tile => {
      const { x, y, type, rotation = 0, objects = [] } = tile;
      const model = tileModels[type];
      if (!model) return null;
      // Position tile: assuming y-axis is up, so we position in X-Z plane
      const posX = x * mapData.tileSize;
      const posZ = y * mapData.tileSize;
      return (
        <group key={`tile-${x}-${y}`}
               position={[posX, 0, posZ]}
               rotation={[0, rotation * Math.PI/180, 0]}>
          {/* Tile base model */}
          <primitive object={model.scene.clone()} />
          {/* Place each scenery object on this tile */}
          {objects.map((obj, i) => {
            const objModel = sceneryModels[obj.type];
            return objModel ? (
              <primitive key={i}
                        object={objModel.scene.clone()}
                        position={obj.position}
                        rotation={obj.rotation ?? [0,0,0]} />
            ) : null;
          })}
        </group>
      );
    })}
  </group>
);
```

In the above snippet, we use `useGLTF` (from @react-three/drei) to load models for each tile type. We then iterate over `mapData.tiles` to create a `<group>` for each tile, positioning it at `(x * tileSize, 0, y * tileSize)` in the scene, and rotating it as specified. Inside each tile’s group, we add the tile’s mesh (`<primitive object={...} />`) and then any objects listed in the tile’s config (e.g. placing the `traffic_light` model at the given offset on that tile). By grouping, when the tile group is rotated, the child objects (like lampposts or bins) rotate with it, maintaining the correct relative placement.

**Extensibility:** This tile system is modular. To add a new road tile shape or a new decoration, you would create the 3D model for it, add its loader (and possibly connectivity rules) to the code, and then just place it in the JSON map. The game will render it accordingly. This makes it easy to expand the city with new features like crosswalk tiles, roundabouts (by combining intersection pieces), or custom track pieces. Since each tile knows what it contains, the game logic can also be extended (for example, a “boost pad” tile could be defined that gives the bike a speed boost when on it).

### Adding Scenery Elements Per Tile

Beyond roads, a city track has **scenery and interactive elements** – bins, lampposts, roadworks signs, buildings, etc. Our JSON structure already allows each tile to include an array of `objects` with a type and position. We handle these by loading models for each object type (similar to tile models) and instantiating them at the specified location on the tile.

For static decorations like lampposts or buildings that are purely visual (or only colliders), you can mark them as static in the physics system (we’ll do this later). For interactive objects like a movable barrier or a collectible item, you might spawn them as dynamic physics bodies or with their own game logic. The key is that the map config drives what appears where.

**Example:** A tile could specify a `"building"` object at a certain corner, and a `"barrel"` object on the road. The rendering loop will load a building model and a barrel model and place them. Later, in the physics setup, we could make the building a static collider (so the bike can’t go through it) and the barrel a dynamic rigid body (so the bike can push it).

By using a data-driven approach, artists or level designers can tweak the JSON to change the map layout, add obstacles, etc., without touching the rendering or game logic code. This makes the system **scalable and easy to maintain**.

## 3D Rendering with React Three Fiber

Now that we have the map definition, we need to **render the 3D world**. We use **React Three Fiber (R3F)** – a React renderer for Three.js – to build our scene declaratively in React. We’ll also use **@react-three/drei** (a library of helpers for R3F) for conveniences like model loading and controls.

### Setting Up the R3F Scene

Start by creating a React project (using Create React App, Vite, or Next.js) and installing the necessary packages:

```bash
npm install three @react-three/fiber @react-three/drei
```

In your main app component, set up the R3F `<Canvas>` which will contain the 3D scene:

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

function App() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 10, 20], fov: 50 }}>
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      
      {/* Controls for debugging (orbit around scene) */}
      <OrbitControls makeDefault />
      
      {/* 3D Scene Contents */}
      <Scene />
    </Canvas>
  );
}
```

Key points:

- We enable `shadows` on the Canvas and set an appropriate pixel ratio (`dpr={[1, 2]}` limits device pixel ratio between 1 and 2, so high-DPI screens don’t overload the GPU with too many pixels).
- We set up some basic lighting: an ambient light for overall illumination and a directional light (like the sun) for shadows.
- We include `<OrbitControls>` from Drei, which lets us orbit the camera with the mouse — useful for debugging the scene. (In a final game, you might remove this and use a fixed camera or chase camera.)
- We use a `<PerspectiveCamera>` or the camera props on Canvas to position the camera. In this case, we placed it at `[0, 10, 20]` looking toward the origin, which should give a good view of our scene initially. This camera will later be adjusted to follow the car.

Our custom `<Scene>` component will contain the game objects: the tile-based map, the player’s car, and so on. We also wrap parts of it in React’s `<Suspense>` to handle async loading (for models). For example:

```jsx
import { Suspense } from 'react';
import { Physics } from '@react-three/rapier';  // we'll set up physics soon

function Scene() {
  return (
    <Suspense fallback={null}>
      <Physics>
        {/* City map tiles */}
        <CityMap />  
        {/* Player's bike */}
        <PlayerCar />
        {/* (Any other entities like opponents or items could go here) */}
      </Physics>
    </Suspense>
  );
}
```

We will discuss the `<Physics>` wrapper in the next section. The `<CityMap>` component would implement the logic we sketched earlier: loading the JSON and placing tile models (with their scenery). The `<PlayerCar>` will load or create the bike model and apply controls.

**Loading Models Efficiently:** We use Drei’s `useGLTF` hook to load models (for road tiles, car, etc.). This hook automatically caches the GLTF model, so if you call `useGLTF('/models/road_straight.glb')` in multiple tiles, it will load once and reuse it. We cloned the scene for each tile instance to have separate objects (you could also use instancing if all tiles share a single geometry). For small props like lampposts that repeat many times, consider using **instanced meshes** – three.js allows you to render many copies of the same geometry in one draw call, which is ideal for repeated scenery like dozens of street lights ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=performance%20tips%20and%20tricks%20in,good%20to%20know%20in%20general)). R3F’s `<InstancedMesh>` or the Drei <Instances> helpers can assist with this.

**Textures and Materials:** Ensure your tile models have textures/materials suitable for real-time rendering. Use reasonably low-resolution textures (e.g. 1K or 2K) and consider using compressed textures or Draco-compressed GLTF to reduce load times. For example, if you have a road surface texture or building facades, they should be optimized for the web.

### Best Practices for Performance (Desktop & Mobile)

Rendering a 3D city and a racing game can be demanding. Three.js and R3F are capable, but we should keep performance in mind:

- **Batching and Instancing:** As mentioned, group repeated objects into single meshes where possible. For example, instead of 100 separate lamppost meshes, use one instanced mesh with 100 instances.
- **Culling:** Three.js will frustum-cull objects outside the camera view by default. Organize your scene (group tiles, etc.) so that off-screen tiles are not rendered. You can also manually toggle visibility of distant sections if needed.
- **Level of Detail (LOD):** If your city becomes large or has high-poly models, consider using simpler models or impostors for far-away objects. This might be overkill for a small track, but it’s a scalable idea.
- **Optimize Lights and Shadows:** Realistic lighting can be expensive. Limit the number of lights affecting large numbers of objects. Baking light into textures (lightmaps) for static scenery can reduce runtime cost. If using shadows, use a single directional light for all shadows (like the sun) and tweak shadow map resolution – on mobile you might lower it to improve frame rate. You can also disable shadows on less important objects.
- **Adjust Render Quality on the Fly:** R3F/Drei has a `<PerformanceMonitor>` component that can watch the frame rate and dynamically reduce rendering quality if needed ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=drcmda%20%20September%2021%2C%202022%2C,12%3A15pm%20%205)). For example, it can lower the pixel resolution or toggle off expensive effects if the frame rate drops on a weaker device.
- **Device Pixel Ratio:** As shown with `dpr={[1, 2]}`, capping the pixel ratio is important for mobile. A high-end phone might have DPR 3.0, which means 9× as many pixels to render compared to DPR 1 – massively affecting performance. It’s often fine to cap at 2 (or even 1.5 for very slow devices). This still looks good and improves speed.
- **Profiling:** Use tools to profile your scene. The `R3F-Perf` component (from drei) or browser devtools can show the frame rate. You can also use Three.js’s built-in stats or extensions like `react-three-fiber’s Perf monitor` to find bottlenecks ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=performance%20tips%20and%20tricks%20in,good%20to%20know%20in%20general)) (for example, too many draw calls or a heavy shader).

By following these practices, you ensure the game **runs smoothly on desktop and can be tuned for mobile**. As one of the R3F authors notes, React Three Fiber provides tools to make apps “run everywhere, from weak devices to the most powerful” ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=scaling%20performance%3A%20React%20Three%20Fiber,devices%20to%20the%20most%20powerful)). Start with a solid desktop experience, and plan to test on mobile, adjusting quality settings as needed.

## Physics Integration (Rapier or Cannon.js)

To make the game interactive, we need a **physics engine** to handle movement and collisions – for example, the bike should not drive through walls, and it should respond to forces when turning or hitting an obstacle. Two popular physics engines for JavaScript are **Cannon.js** and **Rapier**. Cannon.js (specifically the maintained `cannon-es` version) is a pure JS physics engine commonly used with R3F ([GitHub - DanieloM83/R3F-Car-Racing: Mini bike racing webgame on react-three-fiber + cannon.js](https://github.com/DanieloM83/R3F-Car-Racing#:~:text=%2A%20Cannon.js%20,creating%203D%20objects%20and%20scenes)). Rapier is a high-performance physics engine written in Rust, compiled to WASM, with a React Three Fiber wrapper available.

We’ll use **Rapier** via the `@react-three/rapier` library for this guide, as it’s performant and well-integrated with R3F. (You can use Cannon via `@react-three/cannon` similarly – the concepts are almost the same ([GitHub - DanieloM83/R3F-Car-Racing: Mini bike racing webgame on react-three-fiber + cannon.js](https://github.com/DanieloM83/R3F-Car-Racing#:~:text=%2A%20Cannon.js%20,creating%203D%20objects%20and%20scenes)).)

### Setting Up the Physics World

In our R3F `<Canvas>` scene, we already wrapped the content in `<Physics>` (from `@react-three/rapier`). This component creates a physics world with gravity and simulation stepping behind the scenes ([GitHub - pmndrs/react-three-rapier:  Rapier physics in React](https://github.com/pmndrs/react-three-rapier#:~:text=The%20Physics%20Component)). We should specify gravity pointing downward (in three.js, the Y axis is up, so gravity might be `[0, -9.81, 0]` for earth-like gravity). By default, Rapier might use `[0, -9.81, 0]`. For example:

```jsx
<Physics gravity={[0, -9.81, 0]} colliders={false}>
  {/* game objects here */}
</Physics>
```

We set `colliders={false}` on Physics to disable automatic colliders for all meshes, because we will manually specify colliders for better control. (Alternatively, you could allow auto colliders globally or per RigidBody.) The physics simulation runs in a web worker under the hood and steps along with R3F’s frame loop.

### Adding Rigid Bodies and Colliders

In Rapier’s R3F API, we wrap objects in `<RigidBody>` components to give them physics properties ([GitHub - pmndrs/react-three-rapier:  Rapier physics in React](https://github.com/pmndrs/react-three-rapier#:~:text=The%20RigidBody%20Component)). The `<RigidBody>` can automatically generate a collider shape from the mesh it contains, or we can specify colliders explicitly.

**1. Static World Colliders (Roads & Environment):** The road tiles and environment are mostly static – they don’t move, but the bike should collide with them. We have a few options:

- *Auto colliders:* We could wrap each tile’s mesh in `<RigidBody type="fixed">` so that Rapier auto-generates a collider. For example, `<RigidBody type="fixed" colliders="hull"><primitive object={roadModel.scene} /></RigidBody>` would create a fixed (immovable) body and use a convex hull collider encompassing the road mesh ([GitHub - pmndrs/react-three-rapier:  Rapier physics in React](https://github.com/pmndrs/react-three-rapier#:~:text=%3CPhysics%20debug%3E%20%3CRigidBody%20colliders%3D%7B,RigidBody)). A convex hull might be okay for a simple boxy shape, but if the road tile has an L-shape or a hole (e.g., an intersection with empty cross), a convex hull would fill in gaps. Alternatively, `colliders="trimesh"` uses the exact triangle mesh of the model for collision – accurate but potentially slower.
- *Manual colliders:* We can place simplified collider shapes for the environment. For instance, use `<CuboidCollider args={[width/2, height/2, depth/2]} position={...} />` to make invisible walls or curbs. Or if the entire ground is flat, one big plane/cuboid can serve as the ground collider. In our city, we might use boxes to represent buildings or barriers.

A practical approach is to design your road tile models to include simple collision geometry (or markers) and then, in code, either rely on `hull` colliders or add corresponding `<CuboidCollider>` or `<TrimeshCollider>` components. For example, for a straight road, you might add two thin box colliders at the edges (to act as curbs/sidewalks) and leave the road surface open for the bike to drive.

For simplicity, let’s assume roads are flat and we don’t need to worry about the bike falling through – the bike will always stay on Y=0 on the road. We mainly need colliders for the **vertical obstacles**: walls of buildings, lamppost poles, etc. We can wrap each scenery object too in a RigidBody (type fixed) with an appropriate collider. For instance:

```jsx
// In the CityMap rendering loop:
<group ...>  {/* tile group */}
  <RigidBody type="fixed" colliders="hull">
    <primitive object={tileModel.scene.clone()} />
  </RigidBody>
  {objects.map(obj => {
    const objModel = sceneryModels[obj.type];
    const colliderArgs = getColliderFor(obj.type); // e.g. dimensions for a lamppost
    return objModel ? (
      <RigidBody key={...} type="fixed" colliders="hull" position={obj.position}>
        <primitive object={objModel.scene.clone()} />
      </RigidBody>
    ) : null;
  })}
</group>
```

In this snippet, we gave each tile and object a fixed rigid body. This means the physics engine knows about their shapes for collision but will not move them (immovable). We used `colliders="hull"` for simplicity; you could refine colliders per object (e.g. a lamppost could use a small capsule collider instead of hull).

**2. Dynamic Bodies (Vehicles and Moveable Objects):** The player’s bike is a dynamic object – it moves under forces. We will wrap the bike model in `<RigidBody type="dynamic">`. We might also give it a specific collider shape. A simple approach for a bike is to use a box collider roughly the size of the bike body. Alternatively, a combination of a box (for the chassis) and maybe spheres for wheels can be used, but a single box or capsule is fine for basic physics.

We can do:

```jsx
<RigidBody ref={carBodyRef} colliders="cuboid" mass={1} friction={1} restitution={0.2}>
  <primitive object={carModel.scene} />
</RigidBody>
```

This creates a dynamic rigid body with a cuboid collider auto-fitted to the mesh’s bounding box (since colliders="cuboid"), mass of 1, normal friction, and a little restitution (bounciness). The `ref={carBodyRef}` gives us a reference to this physics body so we can control it (accelerate, steer) in the game loop. If using Rapier, `carBodyRef.current` will expose methods like `applyImpulse` or `setLinvel` to influence the body.

If you have other dynamic objects (e.g. perhaps a rolling barrel or an AI opponent’s car), you would also give them dynamic RigidBodies.

**Collision Detection Events:** By default, the physics engine will handle the *response* (the bike will bounce off walls, etc.). If we want to *detect* collisions (say to detect if the bike hit a special item or to play a sound when hitting a wall), Rapier lets you attach collision event listeners. For example, `<RigidBody onCollisionEnter={(other) => { ... }} />` could be used. We won’t dive deep into that here, but know that it’s possible to hook into events for game logic (e.g. detect finish line crossing or item pickups).

### Integrating Physics with the Render Loop

One great thing about using R3F with a physics library is that the physics step and rendering are in sync (by default). The `<Physics>` component from `@react-three/rapier` ensures the physics world updates each animation frame. We then simply control our dynamic bodies by applying forces or setting velocities each frame.

For example, to drive the bike forward, we might apply a forward impulse or set a forward velocity when the up key is pressed. The physics engine then moves the car, and R3F automatically updates the position/rotation of the car’s mesh because it’s a child of the RigidBody.

Rapier’s API offers two main ways to control a body:

- **Forces/impulses:** e.g. `body.applyImpulse({x, y, z}, wakeUp)` to simulate engine force or `body.applyTorqueImpulse({...})` to turn.
- **Direct velocity or position:** e.g. `body.setLinvel({x,y,z}, wakeUp)` to directly set linear velocity, or `body.setRotation()` to set orientation. Directly setting can be less realistic (you’re overriding physics integration), but it’s simpler for arcade-style control.

We’ll use a hybrid: set velocity for forward/back and maybe directly tweak orientation for steering, which gives a responsive Mario Kart feel (rather than complex wheel physics).

## Player Vehicle and Controls

Now, let’s focus on the **player’s car** – loading the model, adding it to the scene with a physics body, and implementing keyboard controls for acceleration, braking, and steering.

### Loading the bike Model

You can use any low-poly bike model (GLTF/GLB). For example, you might have `kart.glb` which contains a kart model. Load it with `useGLTF`:

```jsx
const carGltf = useGLTF('/models/kart.glb');
...
<RigidBody ref={carBodyRef} colliders="cuboid" type="dynamic" mass={1}>
  <primitive object={carGltf.scene} scale={[0.5, 0.5, 0.5]} />
</RigidBody>
```

We scale it down to fit our world (assuming the model might be big). The `carBodyRef` gives us control access. We set type="dynamic" so gravity affects it and it can move.

**Note:** To prevent the bike from tipping over, you can constrain rotations. For example, if we want the bike to only rotate around the Y-axis (yaw) but not roll or pitch (so it stays upright on the road), we can use Rapier’s `enabledRotations` prop: `enabledRotations={[false, true, false]}` (meaning X rotation locked, Y rotation free, Z locked). This way, the bike won’t fall on its side if it hits a wall – it behaves more like a simplified bike that always lands on wheels.

### Implementing Keyboard Controls

We’ll use keyboard input to control the car: **Up/W** for accelerate, **Down/S** for brake/reverse, **Left/A** and **Right/D** for steering. There are multiple ways to capture keyboard events in React:

- Use native event listeners (`window.addEventListener('keydown', ...)`) and track which keys are pressed.
- Use a state management solution or custom hooks (e.g. Zustand or a custom `useKeyboard` hook).
- Use Drei’s **KeyboardControls** helper which provides a context for key states.

Drei’s `<KeyboardControls>` is a convenient option. It wraps your canvas and provides a `useKeyboardControls` hook to get the state of defined keys. For example:

```jsx
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';

function App() {
  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "KeyW"] },
        { name: "backward", keys: ["ArrowDown", "KeyS"] },
        { name: "left", keys: ["ArrowLeft", "KeyA"] },
        { name: "right", keys: ["ArrowRight", "KeyD"] }
      ]}>
      <Canvas>{/* ... scene ... */}</Canvas>
    </KeyboardControls>
  );
}
```

In the above, we map arrow keys and WASD to semantic names. Now inside our PlayerCar component, we can do:

```jsx
const [subscribeKeys, getKeys] = useKeyboardControls();
useFrame(() => {
  // Get the current key state (which keys are pressed)
  const { forward, backward, left, right } = getKeys();
  
  // Access the physics body
  const body = carBodyRef.current;
  if (!body) return;
  
  // Determine the forward direction of the car
  // We'll use the car's orientation to apply force in the direction it's facing.
  const orientation = body.rotation(); // quaternion
  const forwardVector = new THREE.Vector3(0, 0, -1); // assuming model faces -Z
  forwardVector.applyQuaternion(orientation);
  
  // Reset acceleration each frame
  let engineForce = 0;
  if (forward) engineForce += 5;       // forward force
  if (backward) engineForce -= 5;      // backward force (braking/reverse)
  
  // Apply engine force
  if (engineForce !== 0) {
    // Small impulse in forward/backward direction
    body.applyImpulse(forwardVector.multiplyScalar(engineForce * 0.1), true);
  }
  
  // Simple friction / drag: we can dampen velocity slightly when no input
  if (!forward && !backward) {
    const vel = body.linvel();
    // reduce XZ velocity slightly to simulate rolling resistance
    body.setLinvel({ x: vel.x * 0.98, y: vel.y, z: vel.z * 0.98 }, true);
  }
  
  // Steering
  if (left || right) {
    // Rotate the bike around its Y-axis for steering
    const turnAngle = (left ? 1 : 0) + (right ? -1 : 0);
    // Apply a small instantaneous rotation
    const currentRotation = body.rotation(); // quaternion
    const euler = new THREE.Euler().setFromQuaternion(currentRotation);
    euler.y += turnAngle * 0.03; // adjust 0.03 for steering sensitivity
    body.setRotation(euler, true);
    
    // Optionally, you might also yaw the velocity vector so the bike drifts into the turn.
  }
});
```

This pseudocode inside `useFrame` (R3F’s render loop hook) does the following:

- Reads which keys are pressed (forward/backward/left/right).
- Calculates the car’s forward direction vector by taking a base forward (0,0,-1 if the bike model faces -Z in its local space) and rotating it by the car’s current orientation (`body.rotation()` gives a quaternion of the Rapier body).
- Determines an `engineForce` based on keys (e.g. 5 units forward or -5 for backward).
- If there is input, applies an impulse in that forward/backward direction. We scale it by 0.1 as an impulse; applying an impulse each frame simulates acceleration. (Instead of impulse, we could use `body.setLinvel` to directly set a target speed.)
- If no input, we manually dampen the velocity a bit to simulate friction (this prevents the bike from coasting forever). Here we fetch the linear velocity `linvel()` and set it to 98% of XZ components.
- For steering, if left or right is pressed, we adjust the car’s Y rotation slightly each frame. We convert the quaternion to Euler angles, add or subtract a small angle (0.03 rad ~ 1.7° per frame when key held), and set the new rotation. This effectively turns the car. In a real scenario, you might want to also rotate the velocity vector or apply lateral force to mimic traction, but keeping it simple, this will allow the bike to change direction.

Using the above approach, the bike will accelerate when you press Up/W, decelerate with Down/S, and turn with Left/Right. The physics engine will handle collisions: if you steer into a wall, the car’s collider will hit the wall’s collider and stop or slide along it.

**Alternate Approach:** Another method is to use Rapier’s **forces** continuously. For example, instead of impulses, you could do `body.applyForce(forwardVector.multiplyScalar(engineForce), true)` every frame, which is a more continuous acceleration model (impulse is a one-time kick, force is sustained). You might need to tune these values (engineForce, friction) to get a good feel. Arcade racers often simplify physics for controllability.

According to an example in a StackOverflow answer, you can also directly set velocity based on input each frame for an arcade feel ([How to control movement of a person in react three fiber? - Stack Overflow](https://stackoverflow.com/questions/69955057/how-to-control-movement-of-a-person-in-react-three-fiber#:~:text=direction%20,rotation)). They computed a `direction` vector from input and camera rotation, then did `api.velocity.set(direction.x, currentVelocityY, direction.z)` for a character controller. In our case, using impulses gives a bit of acceleration build-up which can feel more natural, but direct velocity setting is easier to ensure a speed cap. Feel free to experiment: for instance, cap the `body.linvel()` length to some maximum speed to prevent the bike from going infinitely fast.

### Camera Follow (Optional)

To mimic the Mario Kart third-person view, we’ll want the camera to follow the bike from behind. There are a couple of ways:

- Parent the camera to the car’s object in the scene graph (not straightforward with physics, since the car’s transform is controlled by Rapier).
- Manually update the camera position in each frame based on the car’s position.

We can use `useFrame` to update the camera. R3F gives us access to the `state.camera`. For example:

```jsx
useFrame((state) => {
  const body = carBodyRef.current;
  if (!body) return;
  const carPos = body.translation(); // Rapier gives us the position vector
  // Desired camera position (behind and above the car)
  const idealCamPos = new THREE.Vector3(0, 5, -10);
  idealCamPos.applyQuaternion(body.rotation()); // rotate it to align with car
  idealCamPos.add(new THREE.Vector3(carPos.x, carPos.y, carPos.z));
  // Smoothly interpolate camera towards ideal position
  state.camera.position.lerp(idealCamPos, 0.1);
  // Look at the car
  state.camera.lookAt(carPos.x, carPos.y + 1, carPos.z);
});
```

This will position the camera 5 units above and 10 units behind the car, relative to the car’s orientation, and smooth the movement. It then makes the camera look at the car. The result is a chase camera that follows as you drive around.

### Testing the Controls

At this point, if you run the app, you should see your city map and the bike sitting on it. Pressing W/Up should cause the bike to move forward, and steering keys should turn it. You can use the OrbitControls (if still enabled) to orbit the scene and watch the bike move, or disable OrbitControls and rely on the chase cam for a real game feel.

Don’t worry if the motion feels a bit off at first – physics tuning is an art. You might adjust the car’s mass, the impulse force, add some linearDamping (Rapier has a `linearDamping` property that automatically slows objects, useful for drag), or tweak the friction on the car’s collider (higher friction means it grips the road more strongly rather than sliding).

## Scenery and Interaction Elements

We’ve already shown how the map JSON can specify scenery on each tile. Now let’s ensure those elements are properly integrated:

- **Rendering:** We place the 3D models for each object at the right location (which we did in CityMap).
- **Physics:** If an object should be collidable, we need to give it a physics collider. We wrapped them in RigidBody with type fixed in the code snippet. For example, a `traffic_light` model can be given a slim box collider so that the bike cannot drive through the pole. A `bin` (trash can) might be something the bike can knock over – in that case, you could even make it a dynamic body with a light mass, so if the bike hits it, it moves. To do that, set `type="dynamic"` and maybe give it a mass (and maybe disable rotation constraints if you want it to topple).
- **Game Logic:** If you have interactive elements (like a boost pad or a checkpoint), you might not want them as physical obstacles but rather triggers. In Rapier, you can make a sensor collider (detects overlap but no physical response) for such things. For a boost pad tile, for instance, you could detect when the car’s collider overlaps it and then apply an extra impulse to the car.

Our guide’s scope is basic, so we’ll assume scenery is mostly static or cosmetic. Ensure to mark purely decorative items that the bike can never reach as non-collidable to save performance – for example, distant background buildings or sky elements don’t need physics at all.

**Dynamic placement:** If the JSON or game design calls for random placement (say, random roadwork cones on the track each race), you can generate those at runtime too. The system can be extended by merging in procedurally generated objects with the static JSON-defined ones.

## Performance and Device Compatibility

Finally, let’s recap performance and discuss device compatibility (especially for mobile or weaker devices):

- **Optimise for Desktop First:** We built the game targeting desktop WebGL. Modern desktop GPUs can handle quite a lot, but still be mindful of polygon counts and fill rate. Test the game in a desktop browser with devtools open to monitor frame rate. Use **profiling tools** to see if the bottleneck is CPU (too many draw calls or heavy physics) or GPU (too many fragments, too high resolution).
- **Mobile-Friendly Rendering:** When you’re happy with desktop, test on a mobile device. Mobile browsers have less CPU and GPU power. You might find you need to dial down settings:
  - Lower `dpr` (maybe `[1, 1.5]` on Canvas for mobile).
  - Use simpler shaders (e.g., avoid expensive post-processing or heavy use of reflections).
  - Possibly reduce the number of active lights or turn off shadows on mobile for a big boost.
  - Use smaller texture sizes for mobile if memory is an issue.
  - Utilize Drei’s `<PerformanceMonitor>` to automatically adjust. It can, for example, decrease resolution until the app runs at a stable 60fps ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=drcmda%20%20September%2021%2C%202022%2C,12%3A15pm%20%205)).
- **Mobile Controls:** Plan for touch controls since mobile has no keyboard. This could mean on-screen buttons/joysticks or tilt controls. React Three Fiber can handle touch events or you can overlay HTML UI for controls. While not implemented in this guide, keep the code structure flexible to plug in another input system. For instance, instead of reading keyboard directly in the bike logic, you could abstract controls into a custom hook that on mobile reads from touch joysticks. This way your `forward/backward/left/right` state could come from either keyboard or touch without changing the bike control logic.
- **Testing and Iteration:** Try the game on multiple devices if possible. If the city map is large and performance suffers, consider scaling down complexity (fewer tiles or detail) for weaker devices. The **React Three Fiber documentation** provides many tips and a list of tools to help games “run everywhere” ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=scaling%20performance%3A%20React%20Three%20Fiber,devices%20to%20the%20most%20powerful)) – take advantage of that.

### Summary of Optimisations (Table)

For clarity, here’s a quick summary of optimisations and design choices for performance and compatibility:

| Optimisation / Feature         | Implementation Tips                                |
|-------------------------------|-----------------------------------------------------|
| **Level Design (Tiles)**      | Keep tile models lean (only necessary faces), and reuse models for repeated tiles to leverage caching. Use JSON to enable/disable tiles or objects to scale world size. |
| **Model and Texture Optimisation** | Use compressed textures (e.g. JPEG or WebP for simple colors, or Basis/KTX2 for GPU compression). Draco-compress GLTF models to reduce download size. Merge geometry where possible (e.g., one building model instead of many pieces). |
| **Instancing & Batching**     | Use InstancedMesh for repeated props (street lights, trees). This drastically cuts down draw calls ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=performance%20tips%20and%20tricks%20in,good%20to%20know%20in%20general)). Merge static meshes in modeling software when you can (e.g., a cluster of objects that always appear together can be one mesh). |
| **Physics Tuning**            | Only give physics to objects that need it (set `colliders={false}` on Physics and manually add colliders selectively). Too many colliders or very complex mesh colliders can slow the physics step. Use primitive colliders (cuboids, spheres) whenever possible instead of mesh colliders. |
| **LOD/Culling**               | If the map is large, consider using fewer tiles outside the immediate race route or unload tiles that are far away. (For example, if making an open-world city, you’d stream tiles in/out, but for a closed circuit it’s less an issue.) |
| **Frame Rate Monitoring**     | Use the `<Perf />` component from drei or the `<PerformanceMonitor />`. They can drop graphical fidelity dynamically. For instance, PerformanceMonitor can lower resolution when it detects low FPS, then increase when stable ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=drcmda%20%20September%2021%2C%202022%2C,12%3A15pm%20%205)). |
| **Responsive Controls**       | Abstract input handling so you can easily switch between keyboard controls and touch controls. On mobile, use large touch targets (e.g., left half of screen = steer left, right half = steer right, tap = brake, etc., or render joystick widgets). |

By implementing these strategies, you ensure the game remains **playable across devices**. As noted in the Three.js forum, many of these steps (instancing, culling, etc.) are essential to make a three.js app “run… from weak devices to the most powerful” ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=scaling%20performance%3A%20React%20Three%20Fiber,devices%20to%20the%20most%20powerful)).

## Conclusion

We have built a comprehensive foundation for a 3D racing game: a data-driven **tile-based map** system for a city road network, rendering via React Three Fiber and Drei, a physics engine (Rapier) for realistic movement and collisions, and basic player controls for driving the car. The use of JSON for map layout makes our game world very flexible – you can reconfigure the track by editing the JSON (or even generate it procedurally for endless tracks). The modular setup allows adding features like new tile types (e.g., curved roads, ramps), more interactive elements (speed boosts, obstacles), or even multiple cars.

This architecture is designed to **scale**. You can add:

- **More Players or AI:** Instantiate additional bike physics bodies for opponents. The same controls logic can be adapted for AI waypoints or remote multiplayer input.
- **Lap System & UI:** Because the map is data-driven, you could mark a certain tile or position as the start/finish line and check when the player crosses it (using a sensor collider) to count laps. React DOM or Drei’s `<Html>` can be used to display speed, lap count, etc.
- **Enhanced Physics:** If you want more realism, you could implement a simple suspension for the bike (e.g., using four RaycastVehicle wheels in Cannon or constraints in Rapier). However, many arcade racers keep it simple and fake the suspension.
- **Graphics Improvements:** Add environment maps for reflections, particle effects for smoke or skid marks when drifting, and so on – just be mindful of performance. Three.js can handle a lot if tuned properly.

By following this guide, you now have a solid starting point for a Mario Kart–inspired racing game in the browser. You can drive around a city track, experience collisions, and easily modify the track layout or scenery. Happy coding, and enjoy extending your racing game!

**Sources:**

- React Three Fiber documentation and examples – R3F allows building Three.js scenes with React components ([GitHub - DanieloM83/R3F-Car-Racing: Mini bike racing webgame on react-three-fiber + cannon.js](https://github.com/DanieloM83/R3F-Car-Racing#:~:text=%2A%20React,creating%203D%20objects%20and%20scenes)).
- Poimandres (pmndrs) libraries (@react-three/fiber, @react-three/drei, @react-three/rapier) for seamless integration of Three.js and physics in React ([GitHub - pmndrs/react-three-rapier:  Rapier physics in React](https://github.com/pmndrs/react-three-rapier#:~:text=import%20,three%2Frapier)) ([GitHub - pmndrs/react-three-rapier:  Rapier physics in React](https://github.com/pmndrs/react-three-rapier#:~:text=The%20Physics%20Component)).
- Rapier physics engine usage in React – setting up `<Physics>` and `<RigidBody>` for dynamic and static objects ([GitHub - pmndrs/react-three-rapier:  Rapier physics in React](https://github.com/pmndrs/react-three-rapier#:~:text=%3CPhysics%20debug%3E%20%3CRigidBody%20colliders%3D%7B,RigidBody)) ([GitHub - pmndrs/react-three-rapier:  Rapier physics in React](https://github.com/pmndrs/react-three-rapier#:~:text=The%20RigidBody%20Component)).
- Keyboard controls with Drei’s KeyboardControls – mapping keys to movement intent ([How to control movement of a person in react three fiber? - Stack Overflow](https://stackoverflow.com/questions/69955057/how-to-control-movement-of-a-person-in-react-three-fiber#:~:text=%2F%2F%20App)) and updating physics bodies on each frame ([Drei + using KeyboardControls - Questions - three.js forum](https://discourse.threejs.org/t/drei-using-keyboardcontrols/62698#:~:text=frontVector.set%280%2C%20up%20,z)).
- Three.js forum and docs on performance – techniques like instancing and dynamic quality adjustment to target both high-end and low-end devices ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=performance%20tips%20and%20tricks%20in,good%20to%20know%20in%20general)) ([How to optimize performance in Threejs? - Questions - three.js forum](https://discourse.threejs.org/t/how-to-optimize-performance-in-threejs/42769#:~:text=drcmda%20%20September%2021%2C%202022%2C,12%3A15pm%20%205)).
- DanieloM83’s R3F bike Racing example (React Three Fiber + Cannon.js) – inspiration for project structure and physics integration in a bike game ([GitHub - DanieloM83/R3F-Car-Racing: Mini bike racing webgame on react-three-fiber + cannon.js](https://github.com/DanieloM83/R3F-Car-Racing#:~:text=%2A%20Cannon.js%20,creating%203D%20objects%20and%20scenes)).
