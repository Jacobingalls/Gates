export const TICKS_PER_SECOND = 10

const ANNOUNCE_SECONDS = 2
const BUFFER_SECONDS = 2
const FLASH_PERIOD = TICKS_PER_SECOND
const SLOW_LOCATOR_PERIOD = TICKS_PER_SECOND * 5
const WAIT_SPEECH_PERIOD = TICKS_PER_SECOND * 5
const WAIT_SPEECH_LENGTH = WAIT_SPEECH_PERIOD / 10

const STEADY_HAND = ["dontWalk", "noRequest", "buffer"]
const CROSSING = ["announce", "walk", "flash", "buffer"]

export const PHASE_TITLES = {
	dontWalk: "Don't Walk", noRequest: "No Request", announce: "Walk Sign On", walk: "Walk", flash: "Flashing Hand", buffer: "Buffer",
}

const ticksFor = (seconds) => Math.max(1, Math.round(seconds * TICKS_PER_SECOND))

// An SR latch: set and reset together read low, and a set still held afterward wins again.
const latch = (held, set, reset) => {
	if (set) {
		return !reset
	}
	return reset ? false : held
}

// The two latches follow their inputs straight away, not on a tick, so a short press still counts.
const settle = (run) => ({
	...run,
	requested: latch(run.requested, run.request, run.phase === "announce"),
	started: latch(run.started, run.start, ["announce", "noRequest"].includes(run.phase)),
})

export const startPedestrian = () => {
	return {
		phase: "dontWalk", ticks: 0, length: 0, requested: false, started: false, request: false, start: false,
		flasher: 0, slow: 0, waiting: 0,
	}
}

// Each press of request starts the wait speech over. If it's already high it first drops for a
// tick, or there'd be no new rising edge for a Speaker to play on.
const restartWaiting = (run) => waitSpeechHigh(run) ? -1 : 0

export const pressPedestrian = (run, { request, start }) => {
	const waiting = request && !run.request ? restartWaiting(run) : run.waiting
	return settle({ ...run, request, start, waiting })
}

// The repeating signals, counted in ticks. The flasher stops low during Walk and starts over,
// high, when the hand starts flashing. The wait speech counts from when a request latches.
const advance = (run) => ({
	...run,
	flasher: run.phase === "walk" ? 0 : (run.flasher + 1) % FLASH_PERIOD,
	slow: (run.slow + 1) % SLOW_LOCATOR_PERIOD,
	waiting: run.requested ? (run.waiting + 1) % WAIT_SPEECH_PERIOD : 0,
})

const waitSpeechHigh = (run) => run.requested && run.waiting >= 0 && run.waiting < WAIT_SPEECH_LENGTH

const flasherHigh = (run) => run.phase !== "walk" && run.flasher < FLASH_PERIOD / 2

// The locator ticks slowly at rest and quickly while the hand warns people off, and is quiet
// while it's safe to cross.
const locatorHigh = (run) => {
	if (run.phase === "dontWalk") {
		return run.slow < SLOW_LOCATOR_PERIOD / 2
	}
	return ["flash", "buffer"].includes(run.phase) && flasherHigh(run)
}

const enter = (run, phase, seconds) => {
	const length = seconds === undefined ? 0 : ticksFor(seconds)
	return settle({ ...run, phase, ticks: length, length })
}

// One clock tick. A timed phase runs for exactly its length, and reads how long the next one
// should be as it starts, the way a timer loads.
export const stepPedestrian = (run, { walkSeconds, flashSeconds }) => {
	const counted = advance(run)
	
	if (run.phase === "dontWalk") {
		if (!run.started) {
			return counted
		}
		return run.requested ? enter(counted, "announce", ANNOUNCE_SECONDS) : enter(counted, "noRequest")
	}
	if (run.phase === "noRequest") {
		return enter(counted, "dontWalk")
	}
	if (run.ticks > 1) {
		return { ...counted, ticks: run.ticks - 1 }
	}
	
	return {
		announce: () => enter(counted, "walk", walkSeconds),
		walk: () => enter({ ...counted, flasher: 0 }, "flash", flashSeconds),
		flash: () => enter(counted, "buffer", BUFFER_SECONDS),
		buffer: () => enter(counted, "dontWalk"),
	}[run.phase]()
}

// Everything the controller drives, given where it is.
export const pedestrianOutputs = (run) => {
	const flashing = run.phase === "flash"
	
	return {
		walk: ["announce", "walk"].includes(run.phase),
		wait: STEADY_HAND.includes(run.phase) || (flashing && flasherHigh(run)),
		showTime: flashing,
		time: flashing ? Math.ceil(run.ticks / TICKS_PER_SECOND) : 0,
		requested: run.requested,
		hold: CROSSING.includes(run.phase),
		walkSign: run.phase === "announce",
		waitSpeech: waitSpeechHigh(run),
		locator: locatorHigh(run),
		perc: run.phase === "walk",
	}
}
