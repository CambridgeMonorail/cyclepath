# Debug Camera Controls

This document explains how to use the camera controls in debug mode while developing and testing the Cyclepath game.

## Activating Debug Mode

To activate debug mode:

1. Launch the game in development mode
2. Press the `D` key to toggle debug mode on (press again to turn it off)

In debug mode, the player character is hidden and camera controls are enabled, allowing free movement around the scene.

## Camera Controls

When in debug mode, you can control the camera using:

| Control | Action |
|---------|--------|
| Left Mouse + Drag | Rotate the camera around its target |
| Right Mouse + Drag | Pan the camera perpendicular to the view direction |
| Mouse Wheel | Zoom in and out |
| Middle Mouse + Drag | Also pans the camera |

## Debug Information Display

When debug mode is active, a camera information panel will appear in the viewport showing:

- Camera position coordinates (X, Y, Z)
- Camera rotation in degrees
- The current target point (look-at position)

This information is useful for:

- Finding the exact position of objects in the scene
- Setting up specific camera angles for testing
- Debugging issues with scene positioning

## Tips for Effective Debugging

- Use the mouse wheel to zoom out for an overview of the entire road network
- Right-click and drag to move laterally around specific areas of interest
- Use the coordinates from the debug panel to reference positions in your code
- Toggle debug visualization with `D` key to see road segment connection points
- Use `P` key to toggle performance statistics

## Example Debug Workflow

1. Press `D` to enter debug mode
2. Use mouse to navigate to the area of interest (road connections, textures, etc.)
3. Check the camera info panel for exact coordinates
4. Use these coordinates in your code if needed
5. Press `D` again to return to normal gameplay

## Technical Implementation

Debug camera mode is implemented in `GameScene.tsx` using React Three Fiber's `OrbitControls` component, which is configured to be active during regular gameplay or when debug mode is enabled.

The `CameraDebugHelper` component displays real-time information about the camera position, rotation, and target using Three.js's utilities for extracting this information.

## Related Features

- Texture debugging (Press `T` key)
- Performance monitoring (Press `P` key)
- Road network visualization (automatically enabled in debug mode)
