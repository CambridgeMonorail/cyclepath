# Road System Texture Rendering Guide

## Overview

This document explains how textures are rendered in the Cyclepath road system, covering the rendering pipeline, common issues, and debugging techniques. The road system uses Three.js with React Three Fiber to render road textures with PBR (Physically Based Rendering) materials.

## Texture Pipeline

### 1. Asset Structure

Road textures are organized in the following directory structure:

```
public/
  assets/
    textures/
      road/
        asphalt.jpg       # Base color/albedo texture
        asphalt_normal.png # Normal map for surface detail
        asphalt_rough.png  # Roughness map for light scattering
```

### 2. Loading Process

Textures are loaded through the following process:

1. The `useRoadTextures` hook is called by `RoadSegmentMesh` component
2. The hook uses `RoadTextureLoader` to load and cache textures
3. `RoadTextureLoader` resolves asset paths across environments
4. Textures are applied to `MeshStandardMaterial` in the `RoadSegmentMesh`

### 3. Texture Mapping

Road segments map textures with the following considerations:

- **UV Mapping**: Road segments use simple plane geometry with normalized UVs
- **Texture Repeat**: Textures are repeated based on segment dimensions (configurable via `repeat` property)
- **Texture Rotation**: Textures can be rotated to align with the road direction

## Common Issues and Solutions

### Issue: Textures Not Loading

**Symptoms**:

- Road appears as a solid gray color
- Console errors about missing textures

**Solutions**:

1. Check browser console for path resolution errors
2. Verify file paths match the expected directory structure
3. Ensure texture files exist and have correct case-sensitivity
4. Check network tab to see if texture requests are being made

### Issue: Texture Stretching/Distortion

**Symptoms**:

- Textures appear stretched or compressed
- Pattern doesn't scale properly with road dimensions

**Solutions**:

1. Adjust texture repeat settings in `RoadSegmentMesh.tsx`
2. Ensure texture dimensions are power-of-two (e.g., 512×512, 1024×1024)
3. Check UV mapping in the plane geometry

### Issue: Incorrect Material Appearance

**Symptoms**:

- Road material looks unrealistic
- PBR properties don't behave as expected

**Solutions**:

1. Verify all texture maps (base, normal, roughness) are properly configured
2. Check material properties (roughness, metalness, etc.)
3. Ensure proper lighting is set up in the scene

## Debugging Tools

### TextureDebugger Component

The `TextureDebugger` component provides a visual display of loaded textures in the scene:

- Enable debug mode via `debug` prop in `RoadNetworkComponent`
- Press 'D' in development mode to toggle debug visuals
- Shows texture path, dimensions, and loading status

### Console Logging

In development mode, the following information is logged:

- Texture resolution steps and paths tried
- Successful texture loads with dimensions
- Material configuration details
- WebGL context information

### Fallback Textures

When textures fail to load, a fallback texture is automatically generated:

- Gray procedural texture with visible pattern
- Red border indicating it's a fallback
- "FALLBACK TEXTURE" text overlay

## Implementation Notes

### Texture Path Resolution

The system tries multiple paths to locate textures across environments:

```typescript
const paths = [
  // Standard path with base URL
  `${baseUrl}/${DEFAULT_TEXTURE_PATH}${filename}`,
  // Direct from public
  `${baseUrl}/assets/textures/road/${filename}`,
  // Without baseUrl (for dev server)
  `/assets/textures/road/${filename}`,
  // Relative path for imports
  `assets/textures/road/${filename}`
];
```

### Texture Configuration

For optimal PBR rendering, textures are configured:

```typescript
texture.colorSpace = THREE.SRGBColorSpace; // For base color textures
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, length / width); // Adjust repeat based on road dimensions
```

## Performance Considerations

- Textures are cached to minimize duplicate loading
- Use power-of-two textures for optimal GPU performance
- Consider reducing texture size for mobile devices
- For large road networks, implement texture atlasing

## Troubleshooting Checklist

1. Is WebGL supported and functioning properly? (Check `checkWebGLSupport()`)
2. Are textures loading from the correct paths?
3. Are texture settings (repeat, rotation) appropriate for the segment?
4. Are material properties correctly configured?
5. Is lighting set up properly to show PBR materials?
6. Are cached textures being properly updated when needed?

## Example Debug Output

When textures are working correctly, you should see console output like:

```
Resolving texture path: "asphalt.jpg" into a URL...
Will try these paths in order: [
  "/assets/textures/road/asphalt.jpg",
  "/public/assets/textures/road/asphalt.jpg",
  "/src/assets/textures/road/asphalt.jpg",
  "/assets/textures/road/asphalt.jpg"
]
Loading texture from: "/assets/textures/road/asphalt.jpg"
✅ Texture loaded successfully: "/assets/textures/road/asphalt.jpg"
```
