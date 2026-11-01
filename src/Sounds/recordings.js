import locator from "./locator.wav?inline"
import percEW from "./perc-ew.wav?inline"
import percNS from "./perc-ns.wav?inline"
import wait from "./wait.wav?inline"
import walkSign from "./walk-sign-is-on.wav?inline"

// Part of the bundle rather than fetched, so they're ready the moment they're asked for, and
// imported on its own, so only a page with a Speaker pays for them.
export const RECORDINGS = { locator, percEW, percNS, wait, walkSign }
