/**
 * Metres you must move before the app spends another API request.
 *
 * This is the main quota dial. RentCast's free Developer plan allows 50
 * requests/month, so at 40m that's roughly 2km of walking before you're out.
 * The search radius is already ~320m (0.2mi), so a larger threshold mostly
 * avoids re-requesting houses you already have. See README.
 */
export const MOVE_THRESHOLD_M = 40;
