# EndPortal

A pixel-perfect WebGL recreation of the Minecraft End Portal shader effect.

## What is the End Portal?

The End Portal is a mystical gateway in Minecraft that transports players to The End dimension. It's characterized by a mesmerizing layered texture effect with swirling, rotating patterns that seem to shift through multiple dimensions in real-time. The effect uses additive color blending and per-layer transformations to create depth and motion.

## Project Description

This project faithfully recreates the End Portal's visual effect for the web using WebGL. It implements the original Minecraft end-portal fragment/vertex shader logic in JavaScript and GLSL, featuring:

- **15 animated layers** with per-layer rotation, scale, and translation
- **Additive blending** (`FUNC_ADD` + `SRC_ALPHA` / `ONE_MINUS_SRC_ALPHA`)
- **Pixel-perfect rendering** using nearest-neighbor texture filtering
- **Glacial animation speed** for authentic Minecraft feel
- **Responsive fullscreen canvas** that scales to window size
- **Minecraft's exact color palette** from the official shader

## Files

- `particles.js` - WebGL shader engine and animation loop
- `index.html` - Entry point with fullscreen canvas
- `styles.css` - Minimal styling for fullscreen presentation
- `end_portal.png` - Texture used for the portal effect

## How It Works

The renderer uses two WebGL shaders:
- **Vertex Shader**: Transforms fullscreen quad to screen-space, outputs `texProj0` for perspective-correct texture sampling
- **Fragment Shader**: Implements the `end_portal_layer()` matrix math, samples the texture 15 times with per-layer transforms, and accumulates color additively

Animation is controlled by `uGameTime` uniform, which drives translation and rotation per layer at a scale of `0.000002`.

## Usage

Open `index.html` in any WebGL-capable browser (Chrome, Firefox, Safari, Edge). The portal effect will render fullscreen with smooth, glacial layer drift.

## Reference

Based on Minecraft's `rendertype_end_portal` shader from the official Minecraft resource pack.
