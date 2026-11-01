const TICK = { duration: .02, frequency: 880, type: "square" }
const TICKS_PER_SECOND = 10
const FAST_CHIRP = { duration: .06, frequency: 2700, to: 3700, type: "sine" }
const VOLUME = .4
const SILENT = .001

const walkTicks = Array.from({ length: TICKS_PER_SECOND }, (_, i) => ({ ...TICK, at: i / TICKS_PER_SECOND }))

const fastChirps = Array.from({ length: TICKS_PER_SECOND }, (_, i) => ({ ...FAST_CHIRP, at: i / TICKS_PER_SECOND }))

const HERE = { duration: .18, frequency: 2400, to: 3600, type: "sine" }
const THERE = { duration: .18, frequency: 3600, to: 2400, type: "sine" }
const hereThere = Array.from({ length: 6 }, (_, i) => ({ ...(i % 2 === 0 ? HERE : THERE), at: i / 2 }))

// Everything a Speaker can play, as tones to synthesize. `at` and `duration` are in seconds,
// `to` slides the pitch over the tone, and `level` scales its volume. A sound with `file`
// plays that entry in RECORDINGS instead, and gives its `length` in seconds. The crossing sounds follow California MUTCD
// Chapter 4K: a locator tone of 0.15 s or less, kept quiet because it's only meant to carry
// a few feet, and a walk tone of 8 to 10 ticks a second, made of several frequencies led by
// 880 Hz, which a square wave is, and which has to sound different from the locator tone.
export const SOUNDS = {
	buttonBeep: { title: "Button Beep", tones: [{ at: 0, duration: .08, frequency: 1500, type: "sine" }] },
	locatorTone: { title: "Locator Tone", tones: [{ at: 0, duration: .15, frequency: 500, type: "sine", level: .35 }] },
	walkTick: { title: "Walk Tick", tones: [{ ...TICK, at: 0 }] },
	walkTicks: { title: "Walk Ticks, 1 Second", tones: walkTicks },
	cuckoo: {
		title: "Cuckoo",
		tones: [{ at: 0, duration: .15, frequency: 1100, type: "sine" }, { at: .2, duration: .25, frequency: 750, type: "sine" }],
	},
	chirp: { title: "Chirp", tones: [{ at: 0, duration: .15, frequency: 2700, to: 3700, type: "sine" }] },
	fastChirps: { title: "Fast Chirps, 1 Second", tones: fastChirps },
	hereThere: { title: "Here and There Chirps, 3 Seconds", tones: hereThere },
	waitSpeech: { title: "Wait", tones: [], file: "wait", length: .41 },
	walkSign: { title: "Walk Sign Is On", tones: [], file: "walkSign", length: 1.59 },
	percEW: { title: "Percussive Walk, East-West", tones: [], file: "percEW", length: 1 },
	percNS: { title: "Percussive Walk, North-South", tones: [], file: "percNS", length: 1 },
	locator: { title: "Locator", tones: [], file: "locator", length: .1 },
}

export const soundLength = (name) => {
	const { tones, length } = SOUNDS[name]
	return length ?? Math.max(...tones.map(({ at, duration }) => at + duration))
}

const SAMPLE_RATE = 44100
const PEAK = 32767
const HEADER_BYTES = 44

const waveAt = (type, phase) => {
	const position = phase % 1
	if (type === "square") {
		return position < .5 ? 1 : -1
	}
	return Math.sin(position * 2 * Math.PI)
}

// Adds a tone into the samples, fading it away like a struck note.
const mixTone = (samples, { at, duration, frequency, to = frequency, type, level = 1 }) => {
	const first = Math.round(at * SAMPLE_RATE)
	const count = Math.round(duration * SAMPLE_RATE)
	let phase = 0
	
	for (let i = 0; i < count; i += 1) {
		const progress = i / count
		phase += (frequency + (to - frequency) * progress) / SAMPLE_RATE
		samples[first + i] += waveAt(type, phase) * VOLUME * level * (SILENT / VOLUME) ** progress
	}
}

const text = (view, at, value) => [...value].forEach((letter, i) => view.setUint8(at + i, letter.charCodeAt(0)))

const toWav = (samples) => {
	const dataBytes = samples.length * 2
	const view = new DataView(new ArrayBuffer(HEADER_BYTES + dataBytes))
	
	text(view, 0, "RIFF")
	view.setUint32(4, HEADER_BYTES - 8 + dataBytes, true)
	text(view, 8, "WAVEfmt ")
	view.setUint32(16, 16, true)
	view.setUint16(20, 1, true)
	view.setUint16(22, 1, true)
	view.setUint32(24, SAMPLE_RATE, true)
	view.setUint32(28, SAMPLE_RATE * 2, true)
	view.setUint16(32, 2, true)
	view.setUint16(34, 16, true)
	text(view, 36, "data")
	view.setUint32(40, dataBytes, true)
	samples.forEach((sample, i) => view.setInt16(HEADER_BYTES + i * 2, Math.max(-1, Math.min(1, sample)) * PEAK, true))
	
	return new Blob([view], { type: "audio/wav" })
}

// Tones are rendered to a WAV rather than played through Web Audio, which Safari can report
// as running while staying silent. An audio element works everywhere.
const renderTones = (name) => {
	const samples = new Float32Array(Math.ceil(soundLength(name) * SAMPLE_RATE))
	SOUNDS[name].tones.forEach((tone) => mixTone(samples, tone))
	return URL.createObjectURL(toWav(samples))
}

const PLAYERS_PER_SOUND = 3
const players = {}
let recordings = null
let loadingRecordings = null

const loadRecordings = () => {
	loadingRecordings = loadingRecordings ?? import("./recordings").then(({ RECORDINGS }) => {
		recordings = RECORDINGS
	})
	return loadingRecordings
}

// Rewinding goes on after a sound finishes, away from the next play. Asking a player to seek
// and play at once is what makes Safari start late, or not at all.
const rest = (player) => {
	player.pause()
	if (player.currentTime === 0) {
		player.idle = true
		return
	}
	player.onseeked = () => {
		player.onseeked = null
		player.idle = true
	}
	player.currentTime = 0
}

const createPlayer = (name, source) => {
	const player = new Audio(source)
	player.dataset.sound = name
	player.preload = "auto"
	player.idle = true
	player.onended = () => rest(player)
	player.load()
	return player
}

const sources = {}

const sourceFor = (name) => {
	const { file } = SOUNDS[name]
	sources[name] = sources[name] ?? (file === undefined ? renderTones(name) : recordings[file])
	return sources[name]
}

const playersFor = (name) => {
	if (SOUNDS[name].file !== undefined && recordings === null) {
		return []
	}
	
	if (players[name] === undefined) {
		const source = sourceFor(name)
		players[name] = Array.from({ length: PLAYERS_PER_SOUND }, () => createPlayer(name, source))
	}
	return players[name]
}

const unlocked = new Set()

// Safari only lets an audio element play on its own once it has played during a press, and
// most sounds here start later, from a clock or a state. So the first press plays each one
// silently, and a press that doesn't count as a gesture just leaves it for the next. It
// stays muted until it's asked to play, because Safari can sound it if unmuted any sooner.
const unlock = (player) => {
	if (unlocked.has(player)) {
		return
	}
	
	unlocked.add(player)
	player.muted = true
	player.play().then(() => {
		if (player.idle) {
			rest(player)
		}
	}).catch(() => unlocked.delete(player))
}

const LOOP_REPEATS = 30
const loopers = {}

const chunkName = (view, at) => String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(at + i)))

// Where a WAV's audio is, past whatever other chunks come before it.
const findData = (view) => {
	let at = 12
	while (chunkName(view, at) !== "data") {
		at += 8 + view.getUint32(at + 4, true)
	}
	return { start: at + 8, size: view.getUint32(at + 4, true) }
}

// One long WAV of the same clip over and over. A looping player leaves a small gap at each
// repeat, and this has no repeats to leave a gap at until the very end.
const repeatedWav = (buffer) => {
	const { start, size } = findData(new DataView(buffer))
	const bytes = new Uint8Array(start + size * LOOP_REPEATS)
	const clip = new Uint8Array(buffer, start, size)
	bytes.set(new Uint8Array(buffer, 0, start))
	for (let i = 0; i < LOOP_REPEATS; i += 1) {
		bytes.set(clip, start + size * i)
	}
	
	const view = new DataView(bytes.buffer)
	view.setUint32(4, bytes.length - 8, true)
	view.setUint32(start - 4, size * LOOP_REPEATS, true)
	return new Blob([bytes], { type: "audio/wav" })
}

export const prepareLoop = async (name) => {
	await loadRecordings()
	if (loopers[name] === undefined) {
		loopers[name] = null
		const buffer = await (await fetch(sourceFor(name))).arrayBuffer()
		loopers[name] = createPlayer(name, URL.createObjectURL(repeatedWav(buffer)))
		loopers[name].loop = true
		loopers[name].dataset.looping = "true"
	}
}

export const startLoop = (name, volume = 100) => {
	const player = loopers[name]
	if (player) {
		player.idle = false
		player.volume = volume / 100
		player.muted = false
		player.play().catch(() => rest(player))
	}
}

export const stopLoop = (name) => {
	if (loopers[name]) {
		rest(loopers[name])
	}
}

const unlockAll = () => {
	Object.keys(SOUNDS).forEach((name) => playersFor(name).forEach(unlock))
	Object.values(loopers).filter(Boolean).forEach(unlock)
}

const PRESSES = ["pointerdown", "mousedown", "mouseup", "click", "touchend", "keydown", "keyup"]

// Every sound is loaded as soon as a Speaker appears, so it's ready before anyone presses.
export const prepareAudio = () => {
	PRESSES.forEach((press) => window.addEventListener(press, unlockAll, { capture: true }))
	loadRecordings().then(() => Object.keys(SOUNDS).forEach(playersFor))
}

// `volume` is a percent, so sounds can be balanced against each other.
export const playSound = (name, volume = 100) => {
	const pool = playersFor(name)
	const player = pool.find(({ idle }) => idle) ?? pool[0]
	if (player === undefined) {
		return
	}
	
	player.volume = volume / 100
	if (!player.idle) {
		player.currentTime = 0
	}
	player.idle = false
	player.muted = false
	player.play().catch(() => rest(player))
}
