# Road System Textures

This document provides a comprehensive guide on how textures are used within the road-system library and what specific files are required for proper rendering.

## Quick Start: Required Texture Files

The minimum required texture files for the road system to display properly are:

1. **Base Road Texture**: `asphalt.jpg` (1024×1024px)
   - **Location**: `apps/cyclepath/public/assets/textures/road/asphalt.jpg`
   - **Purpose**: Provides the main surface appearance for roads

2. **Normal Map**: `asphalt_normal.png` (1024×1024px)
   - **Location**: `apps/cyclepath/public/assets/textures/road/asphalt_normal.png`
   - **Purpose**: Creates the illusion of surface detail and depth

3. **Roughness Map**: `asphalt_roughness.png` (1024×1024px)
   - **Location**: `apps/cyclepath/public/assets/textures/road/asphalt_roughness.png`
   - **Purpose**: Controls light reflection properties of the surface

## Important: Material Configuration

The material in `RoadSegmentMesh.tsx` has been updated to correctly display textures:

```tsx
<meshStandardMaterial
  color={textures.map ? undefined : "#333333"}
  map={textures.map}
  normalMap={textures.normalMap}
  roughnessMap={textures.roughnessMap}
  roughness={0.8}
  metalness={0.2}
  side={THREE.DoubleSide}
/>
```

The key fix was changing the color setting from `color="#ffffff"` to `color={textures.map ? undefined : "#333333"}` to prevent the white color from washing out the texture.

## Texture File Requirements

### 1. Base Road Texture (Required)

This is the main texture that gives the road its visual appearance.

**Format Requirements:**

- **File Type**: JPG or PNG
- **Dimensions**: 1024×1024 pixels (power of 2)
- **Pattern**: Tileable/seamless for proper repeating
- **Color Range**: Mid-to-dark gray (too light will appear washed out)
- **File Path**: `public/assets/textures/road/asphalt.jpg`

**Example Code:**

```typescript
const roadSegment = RoadSegmentFactory.createStraight({
  textureOptions: {
    roadTexture: 'asphalt.jpg' // Just the filename
  }
});
```

### 2. Normal Map (Recommended)

Adds the illusion of surface detail without adding geometry complexity.

**Format Requirements:**

- **File Type**: PNG
- **Dimensions**: Same as base texture (1024×1024px)
- **Format**: DirectX-style normal map (blue/purple appearance)
- **File Path**: `public/assets/textures/road/asphalt_normal.png`

**Example Code:**

```typescript
const roadSegment = RoadSegmentFactory.createStraight({
  textureOptions: {
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png'
  }
});
```

### 3. Roughness Map (Recommended)

Controls how light scatters across the surface of the road.

**Format Requirements:**

- **File Type**: PNG (grayscale)
- **Dimensions**: Same as base texture (1024×1024px)
- **Values**: White = rough, Black = smooth
- **File Path**: `public/assets/textures/road/asphalt_roughness.png`

**Example Code:**

```typescript
const roadSegment = RoadSegmentFactory.createStraight({
  textureOptions: {
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png',
    roughnessMap: 'asphalt_roughness.png'
  }
});
```

### 4. Road Markings (Generated Automatically)

Road markings are procedurally generated based on the road segment type, so no additional files are required.

## How to Create Required Texture Files

### Option 1: Use Sample Textures

A set of sample textures can be downloaded from the project repository or from texture sites like [ambientCG](https://ambientcg.com/view?id=Asphalt01) (free PBR materials).

### Option 2: Create Your Own

To create your own textures:

1. **Base Texture**:
   - Photograph asphalt or concrete
   - Edit to be seamless in Photoshop or GIMP (Filter > Other > Offset)
   - Save at 1024×1024px resolution

2. **Normal Map**:
   - Generate from the base texture using:
     - Photoshop: Filter > 3D > Generate Normal Map
     - GIMP: Filters > Generic > Normal Map
     - Online tools: [NormalMap Online](https://cpetry.github.io/NormalMap-Online/)

3. **Roughness Map**:
   - Convert base texture to grayscale
   - Adjust levels to control roughness
   - Smooth areas should be darker, rough areas lighter

## How Textures are Applied

The road system applies textures in this sequence:

1. When a road segment is created, texture options are specified or defaults are used
2. The `useRoadTextures` hook loads or generates textures for each segment
3. Three types of textures are applied to each road segment:
   - Base texture (asphalt)
   - Roughness map
   - Procedurally generated road markings

## Texture Path Resolution

Texture paths are resolved as follows:

- Bare filename (`asphalt.jpg`): Resolved to `/assets/textures/road/asphalt.jpg`
- Relative path (`textures/custom/brick.jpg`): Resolved with base URL
- Full path (`/assets/textures/special.jpg`): Used with base URL
- URL (`https://example.com/texture.jpg`): Used as-is

## Troubleshooting Texture Issues

If textures aren't displaying properly:

1. **Verify File Existence**:

   ```
   public/assets/textures/road/asphalt.jpg
   public/assets/textures/road/asphalt_normal.png (optional)
   public/assets/textures/road/asphalt_roughness.png (optional)
   ```

2. **Check Console for Errors**:
   Look for warnings like "Failed to load texture from [path]"

3. **Test Direct URL Access**:
   Try accessing the texture directly in browser:
   `http://localhost:4200/assets/textures/road/asphalt.jpg`

4. **Add Texture Debugging**:

   ```typescript
   // Add to GameScene component
   useEffect(() => {
     const testTexture = RoadTextureLoader.loadTexture('asphalt.jpg');
     console.log('Texture loaded:', testTexture.image);
   }, []);
   ```

5. **Check Material Settings**:
   Ensure color property isn't washing out the texture (should be undefined or a mid-tone gray)

## Performance Optimization

For best performance:

- Keep texture files under 1MB each
- Use JPG for base textures (85% quality is usually sufficient)
- Use PNG for normal and roughness maps
- Ensure all textures are power-of-2 dimensions (512×512, 1024×1024, etc.)
- Properly compress textures for production builds
