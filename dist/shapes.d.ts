import type { Bitmap } from './mapping';
/** A square outline (just the border of the 8x8 grid). */
export declare function squareOutline(): Bitmap;
/**
 * A rough circle outline, using a simple midpoint-distance check against
 * a center point and radius. Treat this as a starting point to refine by
 * eye on the real hardware -- an 8x8 grid is coarse enough that "looks
 * like a circle" is more important than mathematical precision.
 */
export declare function circleOutline(): Bitmap;
/** A right triangle outline, corners at top-left, bottom-left, bottom-right. */
export declare function triangleOutline(): Bitmap;
