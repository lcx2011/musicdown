# Bilibili Downloader for Windows 7

A lightweight, portable Bilibili video search and download application designed for Windows 7 (32-bit) environments.

## Features

- Search Bilibili videos by keyword
- Visual card-based results display
- Preview videos in browser
- One-click download to desktop
- Modern UI with Tailwind CSS
- Portable executable (no installation required)

## Technology Stack

- Electron 22.x (Windows 7 32-bit support)
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Jest + fast-check for testing

## Development

### Prerequisites

- Node.js 16+ (for development)
- npm or pnpm

### Install Dependencies

```bash
npm install
# or
pnpm install
```

### Run Development Server

**Important:** This is an Electron application and must be run with Electron, not just the Vite dev server.

```bash
# Run in Electron (recommended for development)
npm run electron:dev

# Run Vite dev server only (for UI development, limited functionality)
npm run dev
```

**Note:** Running `npm run dev` alone will show errors because Node.js modules (fs, path, electron) are not available in the browser. Always use `npm run electron:dev` for full functionality.

### Run Tests

```bash
npm test
```

### Build for Windows 7 32-bit

See [BUILD.md](BUILD.md) for detailed build instructions.

Quick build:
```bash
npm run build:portable
```

This will create a portable executable: `dist-builder/BilibiliDownloader-Portable.exe`

**Note:** You need to create an application icon at `assets/icon.ico` before building. See BUILD.md for details.

## Project Structure

```
├── electron/          # Electron main process
├── src/              # React application source
│   ├── components/   # React components
│   ├── services/     # Business logic
│   ├── types/        # TypeScript types
│   └── utils/        # Utility functions
├── assets/           # Application assets
└── dist/             # Build output
```

## Requirements

- Windows 7 32-bit or higher
- No additional runtime dependencies

## License

MIT
