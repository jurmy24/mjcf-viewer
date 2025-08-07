# Next.js MuJoCo WASM Viewer

A Next.js implementation of the MuJoCo in-browser simulator that runs MuJoCo physics simulations directly in the browser using WebAssembly.

## About

This project is a Next.js wrapper around the [zalo/mujoco_wasm](https://github.com/zalo/mujoco_wasm) library, which provides MuJoCo physics simulation capabilities in the browser through WebAssembly. It allows you to run and visualize MuJoCo physics simulations with a simple web interface.

## Features

- 🎮 Interactive 3D physics simulation viewer
- 🎯 Real-time MuJoCo physics engine running in WebAssembly
- 📁 Load and visualize various MuJoCo model files (.xml)
- 🎨 Three.js powered 3D rendering with orbit controls
- 📱 Responsive design that works on desktop and mobile

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the MuJoCo simulator in action.

## Credits

This project is built on top of the excellent [zalo/mujoco_wasm](https://github.com/zalo/mujoco_wasm) library, which provides the core MuJoCo WebAssembly implementation. The original MuJoCo physics engine is developed by DeepMind.

## Technology Stack

- **Next.js 15** - React framework
- **Three.js** - 3D graphics library
- **MuJoCo WASM** - Physics simulation engine
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
