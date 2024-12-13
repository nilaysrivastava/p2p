# P2P File Sharing Platform

A command-line tool for sharing files over LAN using P2P technology.

## Usage

To share a file:
```bash
npm run share
```

To discover and download files:
```bash
npm run discover
```

## Features

- Share files over local network
- Automatic peer discovery
- Real-time file transfer
- Interactive CLI interface
- Progress indicators

## Architecture

The application is organized into several modules:

- `config/`: Configuration constants
- `utils/`: Reusable utility functions
- `services/`: Core business logic
  - `sharing.js`: File sharing service
  - `discovery.js`: File discovery service
  - `fileTransfer.js`: File transfer handling

## Network Protocol

- Uses UDP multicast for peer discovery
- TCP for reliable file transfers
- Automatic port configuration