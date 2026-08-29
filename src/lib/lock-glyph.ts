/**
 * Geometry for the Lock mark.
 *
 * The shackle is hinged at the base of its left leg and swings closed as
 * progress runs 0 -> 1, exactly like a padlock being pushed shut. Everything
 * here is a pure function of progress so the same glyph can be rendered
 * statically by React or driven attribute-by-attribute inside an animation
 * loop, and so the motion is reversible at any point.
 */

/** Hinge point: the base of the fixed leg, in viewBox units. */
export const HINGE = { x: 8.2, y: 10.6 } as const;

/** How far the shackle swings open at rest, in degrees. */
const OPEN_ANGLE = 34;

/** Body of the lock — constant; only the shackle moves. */
export const BODY = { x: 4.6, y: 10.6, width: 14.8, height: 9.4, radius: 3.2 } as const;

/**
 * The shackle, drawn seated. Opening is expressed as rotation about HINGE.
 *
 * The legs stop just short of the body so their round caps finish underneath
 * the body's stroke — at glyph size that is invisible, but the same geometry
 * is drawn at 360px on the share card, where a protruding cap would show.
 */
export const SHACKLE_PATH = "M8.2 10.2V7.6a3.8 3.8 0 0 1 7.6 0v2.6";

export type GlyphPose = {
  /** Degrees to rotate the shackle about the hinge. 0 = shut. */
  angle: number;
  /** SVG transform for the shackle group. */
  transform: string;
  /** Shackle stroke width — thickens very slightly as it seats. */
  strokeWidth: number;
};

/**
 * Pose the glyph for a travel fraction.
 *
 * The swing is eased so the last stretch of the gesture reads as the shackle
 * dropping into the body rather than as linear rotation.
 */
export function glyphPose(progress: number): GlyphPose {
  const p = Math.min(1, Math.max(0, progress));
  // Slight ease-in: early travel opens/closes gently, the seat is decisive.
  const seated = p * p * (3 - 2 * p);
  const angle = -OPEN_ANGLE * (1 - seated);
  return {
    angle,
    transform: `rotate(${angle.toFixed(3)} ${HINGE.x} ${HINGE.y})`,
    strokeWidth: 1.74 + seated * 0.16,
  };
}
