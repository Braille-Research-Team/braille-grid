"use strict";
// useBrailleGrid.ts
//
// React hook for using the 8x8 braille grid device inside a Next.js/React
// component. Handles the Web Serial connection lifecycle and exposes
// drawShape() so a lesson component can be as simple as:
//
//   const { state, connect, drawShape } = useBrailleGrid();
//   <button onClick={connect}>Connect grid device</button>
//   <button onClick={() => drawShape(circleOutline)}>Show circle</button>
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBrailleGrid = useBrailleGrid;
const react_1 = require("react");
const brailleGrid_1 = require("./brailleGrid");
const webSerialTransport_1 = require("./webSerialTransport");
function useBrailleGrid() {
    const gridRef = (0, react_1.useRef)(null);
    const [state, setState] = (0, react_1.useState)(() => webSerialTransport_1.WebSerialTransport.isSupported() ? 'disconnected' : 'unsupported');
    const [error, setError] = (0, react_1.useState)(null);
    const connect = (0, react_1.useCallback)(async () => {
        if (!webSerialTransport_1.WebSerialTransport.isSupported()) {
            setState('unsupported');
            return;
        }
        setState('connecting');
        setError(null);
        try {
            const transport = new webSerialTransport_1.WebSerialTransport();
            await transport.requestPort(); // shows the browser's device picker
            const grid = new brailleGrid_1.BrailleGrid(transport);
            await grid.connect();
            await grid.safeState();
            await grid.allDown(); // start every lesson from a known, blank grid
            gridRef.current = grid;
            setState('connected');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setState('disconnected');
        }
    }, []);
    const disconnect = (0, react_1.useCallback)(async () => {
        if (gridRef.current) {
            await gridRef.current.disconnect();
            gridRef.current = null;
        }
        setState((prev) => (prev === 'unsupported' ? prev : 'disconnected'));
    }, []);
    const drawShape = (0, react_1.useCallback)(async (bitmap) => {
        if (!gridRef.current) {
            throw new Error('Braille grid is not connected yet.');
        }
        await gridRef.current.drawShape(bitmap);
    }, []);
    const clear = (0, react_1.useCallback)(async () => {
        if (!gridRef.current) {
            throw new Error('Braille grid is not connected yet.');
        }
        await gridRef.current.allDown();
    }, []);
    return { state, error, connect, disconnect, drawShape, clear };
}
