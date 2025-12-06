# Bluetooth Implementation Documentation

This directory contains a TypeScript port of the smart cube Bluetooth implementation from [csTimer](https://cstimer.net/). It has been adapted for use in a Svelte 5 application.

## Overview

The purpose of this module is to enable Web Bluetooth communication with various smart cubes (GAN, GoCube, MoYu, QiYi, etc.). It handles device discovery, connection, encryption (AES-128), and parsing of move data.

## Architecture

The implementation is modularized into several core components:

### 1. Core Logic (`src/lib/bluetooth/core/`)

*   **`bluetooth.ts`**: The central controller. It exports the `GiikerCube` object (singleton-like) which manages the connection lifecycle.
    *   `init()`: Triggers the Web Bluetooth device picker and establishes a connection.
    *   `stop()`: Disconnects the current device.
    *   `isConnected`: Checks connection status.
*   **`mathlib.ts`**: A minimal port of csTimer's math library. It defines the `CubieCube` class and handles move tables, facelet representations, and basic cube operations required for parsing non-standard cube data (like Giiker).
*   **`aes.ts`**: Implements AES-128 encryption/decryption. This is crucial for newer cubes (like GAN and MoYu AI) that encrypt their Bluetooth traffic.
*   **`utils.ts`**: Contains utility functions and shims to emulate the csTimer environment (e.g., `kernel` object) so the original cube drivers could be ported with minimal logic changes.

### 2. Cube Drivers (`src/lib/bluetooth/cubes/`)

Each file in this directory normally corresponds to a specific hardware protocol.
*   **`gancube.ts`**: Driver for GAN cubes (uses AES).
*   **`moyucube.ts`**: Driver for older MoYu cubes.
*   **`moyu32cube.ts`**: Driver for MoYu 3x3 AI (uses specific handshake).
*   **`qiyicube.ts`**: Driver for QiYi cubes.
*   **`gocube.ts`**: Driver for GoCube/Rubik's Connected.
*   **`giikercube.ts`**: Driver for the original Xiaomi Giiker.

### 3. State Management (`src/lib/bluetooth/store.svelte.ts`)

This file exposes a reactive Svelte 5 store (`bluetoothState`) that the UI components listen to.

*   `isConnected`: Boolean status.
*   `deviceName`: Name of the connected device.
*   `batteryLevel`: Current battery percentage.
*   `lastMove`: The standard notation string of the last move made (e.g., "R'", "U2").
*   `moveCounter`: Increments on every move to allow reactivity even if the same move is repeated.
*   `facelet`: The raw facelet string representing the cube state.

## Porting Strategy

The original csTimer code relies heavily on global variables and a specific build system. The porting process involved:

1.  **TypeScript Conversion**: Adding type safety to key interfaces (Cube drivers, `CubieCube`).
2.  **ES Modules**: Converting `var` and global assignments to `export`/`import` statements to make the code modular and tree-shakeable.
3.  **Shims**: Creating `utils.ts` to mock the `kernel` and `mathlib` globals that csTimer drivers expect, allowing us to paste the driver logic with minimal modification.
4.  **AES Extraction**: Isolating the AES logic into a dedicated class (`AES128` in `aes.ts`) instead of inline bit-shifting spaghetti code.

## Usage Guide

### Connecting a Cube

To initiate a connection, call `GiikerCube.init()`. This must be triggered by a user gesture (like a button click) due to browser security restrictions on Web Bluetooth.

```typescript
import { GiikerCube } from '$lib/bluetooth';

async function connect() {
    try {
        await GiikerCube.init();
    } catch (e) {
        console.error("Connection failed", e);
    }
}
```

### Listening for Moves

Components should subscribe to `bluetoothState` in `store.svelte.ts`.

```svelte
<script>
    import { bluetoothState } from '$lib/bluetooth/store.svelte';

    $effect(() => {
        // This will run whenever a move is made
        console.log("New move:", bluetoothState.lastMove);
        console.log("Move count:", bluetoothState.moveCounter);
    });
</script>
```

### Adding New Cubes

1.  Port the driver file from csTimer's source to `src/lib/bluetooth/cubes/`.
2.  Ensure it implements the standard driver interface (registering itself via `GiikerCube.regCubeModel`).
3.  Import the new file in `src/lib/bluetooth/index.ts` to ensure it registers at runtime.

```typescript
// src/lib/bluetooth/index.ts
import './cubes/some-new-cube.ts';
```

## Known Limitations

*   **Browser Support**: Web Bluetooth is primarily supported in Chrome, Edge, and Opera. Firefox and Safari have limited or no support.
*   **Hardware Quirks**: Different cube firmwares may behave differently. The drivers attempt to handle common variations, but testing on physical hardware is always required.
