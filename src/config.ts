/**
 * Metres you must move before the app spends another API request.
 *
 * This is the main quota dial. RentCast's free Developer plan allows 50
 * requests/month, so at 40m that's roughly 2km of walking before you're out.
 * The search radius is already ~320m (0.2mi), so a larger threshold mostly
 * avoids re-requesting houses you already have. See README.
 */
export const MOVE_THRESHOLD_M = 40;

/**
 * How far away a house can be and still get an AR tag.
 *
 * Keep this at or above the search radius (0.2mi ≈ 322m), otherwise houses
 * you paid an API request for are silently dropped before they're drawn.
 */
export const MAX_DISTANCE_M = 320;

/**
 * Approximate horizontal camera field of view in portrait, in degrees.
 * A house is drawn when its bearing falls within ±HFOV_DEG/2 of your heading,
 * so this is a ~55° window out of 360° — most houses are behind you at any
 * moment, which is why the HUD reports how many are out of frame.
 */
export const HFOV_DEG = 55;
