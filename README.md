# Everclimb

An infinite vertical scroller where you ascend shifting walls in a hex-grid world. Dodge hazards, master stamina, and outlast the climb because in Everclimb, there is no summit.

## 🎮 About

Everclimb is a challenging infinite climbing game built with Phaser.js and packaged as a desktop application using Electron. Navigate through procedurally generated hex-grid levels, avoid obstacles, and see how high you can climb!

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sri-shubham/Everclimb.git
   cd Everclimb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## 🛠️ Development

### Running in Development Mode

For development with hot reload (recommended):

```bash
# Start the development server with Electron
npm run electron:dev
```

This command will:

- Compile TypeScript files for Electron
- Start the Vite development server
- Launch the Electron app with dev tools open
- Enable hot reload for code changes

### Alternative Development Commands

```bash
# Run just the web version in browser
npm run dev

# Run Electron with current build (no hot reload)
npm run electron

# Compile Electron TypeScript files only
npm run electron:build-main
```

## 📦 Building for Production

### Build the Application

```bash
# Build web assets and prepare for production
npm run build
```

### Create Distribution Packages

```bash
# Build and package the app for your current platform
npm run electron:build

# Create distribution packages for all platforms
npm run dist
```

This will create platform-specific installers in the `release/` directory:

- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer (NSIS)
- **Linux**: `.AppImage` package

## 🎯 Game Controls

- **Movement**: Use arrow keys or WASD to navigate
- **Climb**: Move upward to advance through levels
- **Pause**: Press `Escape` or use the menu
- **New Game**: Press `F2` or use the menu
- **Fullscreen**: Press `F11` or use the menu

## 🏗️ Project Structure

```
Everclimb/
├── electron/           # Electron main and preload processes
│   ├── main.ts         # Main Electron process
│   ├── preload.ts      # Preload script for secure communication
│   └── tsconfig.json   # TypeScript config for Electron
├── engine/             # Game engine components
├── scenes/             # Phaser.js game scenes
├── level/              # Level generation logic
├── render/             # Rendering components
├── scripts/            # Build and utility scripts
├── dist/               # Built web assets
├── dist-electron/      # Compiled Electron files
└── release/            # Distribution packages (created after build)
```

## 🔧 Available Scripts

| Command                       | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `npm run dev`                 | Start Vite development server (web only)       |
| `npm run build`               | Build for production (web assets)              |
| `npm run preview`             | Preview production build locally               |
| `npm run electron`            | Run Electron app with current build            |
| `npm run electron:dev`        | Development mode with hot reload               |
| `npm run electron:build-main` | Compile Electron TypeScript files              |
| `npm run electron:build`      | Build and package for current platform         |
| `npm run dist`                | Create distribution packages for all platforms |

## 🖥️ Platform Support

- **macOS**: Native .dmg installer
- **Windows**: NSIS installer (.exe)
- **Linux**: AppImage package

## 🐛 Troubleshooting

### White Screen on Startup

If you see a white screen when running the Electron app:

1. Make sure the development server is running:

   ```bash
   npm run dev
   ```

2. Try the development mode:

   ```bash
   npm run electron:dev
   ```

3. Check the browser console (DevTools open automatically in dev mode)

### Build Issues

If you encounter build errors:

1. Clean install dependencies:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Ensure TypeScript files compile:
   ```bash
   npm run electron:build-main
   ```

### Port Already in Use

If port 5173 is busy:

```bash
# Kill processes using the port
lsof -ti:5173 | xargs kill -9
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎪 Game Jam

This game was created for a game jam event. The theme was infinite climbing and procedural generation.

---

**Happy Climbing!** 🏔️
