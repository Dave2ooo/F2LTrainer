# Bluetooth Smart Cube Integration

This directory contains the Bluetooth smart cube integration ported from csTimer.

## Structure

```
bluetooth/
├── core/
│   ├── bluetooth.ts      # Main Bluetooth manager
│   ├── mathlib.ts        # Cube state representation (CubieCube)
│   ├── utils.ts          # Shim layer for csTimer dependencies  
│   └── types.ts          # TypeScript type definitions
├── cubes/
│   └── giikercube.ts     # Giiker/Mi Smart cube implementation
└── example.ts            # Usage examples
```

## Current Status

- ✅ Core Bluetooth manager ported
- ✅ Mathlib (CubieCube) for cube state
- ✅ Utility shim layer (jQuery/giikerutil replacements)
- ✅ Giiker cube implementation
- 🔄 Additional cube implementations (GAN, GoCube, etc.) - ready to port
- ⏳ Svelte integration layer - next step

## Supported Cubes (Ready to Use)

- **Giiker/Mi Smart Magic Cube** - Fully implemented

## Cubes Ready to Port

The following cubes can be added following the same pattern:
- GAN cubes (all versions)
-  GoCube / Rubik's Connected
- MoYu cube
- QiYi cube

## Usage Example

```typescript
import { GiikerCube } from '$lib/bluetooth/core/bluetooth';
import '$lib/bluetooth/cubes/giikercube';

// Connect to cube
await GiikerCube.init();

// Set callback for cube updates
GiikerCube.setCallback((facelet, prevMoves, timestamps, deviceName) => {
  console.log('Cube state:', facelet);
});

// Get battery level
const cube = GiikerCube.getCube();
const [level, name] = await cube.getBatteryLevel();

// Disconnect
await GiikerCube.stop();
```

## Design Philosophy

This port keeps the csTimer code as unchanged as possible to facilitate future updates:

1. **Minimal changes**: Only imports/exports and type annotations added
2. **Shim layer**: `utils.ts` provides jQuery/giikerutil replacements
3. **Same logic**: All Bluetooth protocols kept identical to csTimer
4. **Easy updates**: When csTimer updates, just copy new code and update imports

## Next Steps

1. Add more cube implementations (copy from csTimer, update imports)
2. Create Svelte 5 runes-based store for reactive state
3. Build UI components for connection management
4. Test with physical cubes

## Development

```bash
# Type check
npm run check

# Build
npm run build
```

## References

- [csTimer Hardware Code](https://github.com/cs0x7f/cstimer/tree/master/src/js/hardware)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
