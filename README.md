# braille-grid (browser / Web Serial version)

Browser-side driver for the 8x8 electromagnetic braille pin grid, meant to
drop into the DotQuest Next.js codebase. Draw a shape into the physical
grid with a single call: `drawShape(bitmap)`, where `bitmap` is an 8x8
array.

This is the browser counterpart to the Node/`serialport`-based version of
this library (useful for local dev/testing scripts outside the browser).
Both share the same `mapping.ts` logic and the same physical-layout
findings -- only the transport (how bytes actually get to the device)
differs.

## Browser support: Web Serial API

This connects to the device using `navigator.serial` (Web Serial API),
which requires a Chromium-based browser or Firefox 151+:

| Browser | Support |
|---|---|
| Chrome / Edge / Opera (desktop) | Yes |
| ChromeOS (Chromebooks) | Yes (Chromium-based) |
| Firefox 151+ (stable, ~May 2026 onward) | Yes |
| Safari (macOS & iOS) | No -- WebKit has explicitly opposed this API, citing fingerprinting/security concerns. No indication this will change. |

Since Chromebooks are the classroom standard, this should cover the vast
majority of real usage. Supporting Safari would require a native local
helper app or browser extension bridging the serial connection over a
WebSocket -- real added complexity for a browser that has explicitly
declined to support the underlying API. Worth revisiting only if a real
Safari-only deployment need comes up.

Always feature-detect with `WebSerialTransport.isSupported()` and show a
friendly fallback message rather than a broken "Connect" button -- see
`ExampleShapeLesson.tsx`.

## How the device works

See the main library's README for the full writeup (device firmware,
matrix-driven latching electromagnets, `safe_state()` behavior, etc).
Short version: the board runs MicroPython and exposes a REPL over serial;
`em.cell{N}_dot{M}_up()` / `_down()` control individual dots, and this
library figures out which N/M to call for a given (row, col) in your 8x8
array.

**Dots are latching** -- once raised, a dot stays raised (no continuous
power) until explicitly lowered. `safeState()` only disables the driver
electrically; it does not lower any dots.

## Files

- `mapping.ts` -- pure coordinate translation, `(row, col) -> {cell, dot}`.
  No dependencies; usable anywhere.
- `webSerial.d.ts` -- minimal ambient TypeScript types for the Web Serial
  API (TypeScript's DOM lib doesn't include these yet). Delete this if the
  main project later adds an official types package for it.
- `webSerialTransport.ts` -- `WebSerialTransport`, implementing a small
  `Transport` interface (`open`/`close`/`write`/`onData`/`offData`) using
  `navigator.serial`.
- `brailleGrid.ts` -- `BrailleGrid`, the transport-agnostic controller
  with `drawShape()`, `setDot()`, `allUp()`, `allDown()`, `safeState()`.
- `useBrailleGrid.ts` -- React hook wrapping the above for use in Next.js
  components; manages connection state and exposes `connect`/`drawShape`.
- `shapes.ts` -- example outline generators (square, circle, triangle) to
  demonstrate the array format. Treat these as a starting point, not a
  finished shape library -- especially the circle, which you'll likely
  want to hand-tune once you see it on the real 8x8 grid.
- `ExampleShapeLesson.tsx` -- minimal example component wiring it all
  together, including the Safari fallback message.

## Usage

```tsx
import { useBrailleGrid } from './useBrailleGrid';
import { circleOutline } from './shapes';

function ShapeProblem() {
  const { state, connect, drawShape } = useBrailleGrid();

  return (
    <>
      {state !== 'connected' && (
        <button onClick={connect}>Connect grid device</button>
      )}
      <button onClick={() => drawShape(circleOutline())}>
        Show circle
      </button>
    </>
  );
}
```

Important: `connect()` must be called from inside a user gesture handler
(a button's `onClick`, not `useEffect` on mount) -- browsers require this
for security, since `requestPort()` opens a native device picker.

## Open questions / things worth deciding as a team

- **Reconnecting across lessons/pages.** Web Serial does not let you
  silently reconnect to a previously-granted port on page load; the user
  must click "Connect" again (though `navigator.serial.getPorts()` can
  list previously-authorized ports to skip the picker, if you want to
  build a "remembered device" flow).
- **REPL as the production protocol.** As noted in the main README, this
  currently talks to the device's live interactive REPL. That's fine for
  now, but means anyone who opens a serial terminal to the port has full
  control of the board. Worth revisiting if/when this moves from
  classroom prototype to a more locked-down deployment.
- **Command batching.** Each `drawShape()` call currently sends one
  statement per changed dot and waits for the prompt before sending the
  next. This has been fine in testing but if a lesson ever needs to
  redraw large parts of the grid rapidly, batching multiple calls into
  one REPL statement (e.g. `em.cell1_dot1_up(); em.cell2_dot3_down()`)
  would cut down round trips.
