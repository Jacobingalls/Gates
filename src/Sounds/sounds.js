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

// Web Audio rather than audio elements: in WebKit, an element's play() can block the page on
// the GPU process, for a moment or for good. One context also keeps a looped clip gapless.
let context = null

const audio = () => {
	context = context ?? new AudioContext()
	return context
}

const buffers = {}
const decoding = {}

const renderTones = (name) => {
	const buffer = audio().createBuffer(1, Math.ceil(soundLength(name) * SAMPLE_RATE), SAMPLE_RATE)
	SOUNDS[name].tones.forEach((tone) => mixTone(buffer.getChannelData(0), tone))
	return buffer
}

// A recording isn't ready until it's decoded, which is why a Speaker asks ahead of time.
const decodeRecording = (name) => {
	decoding[name] = decoding[name] ?? import("./recordings").then(async ({ RECORDINGS }) => {
		const response = await fetch(RECORDINGS[SOUNDS[name].file])
		buffers[name] = await audio().decodeAudioData(await response.arrayBuffer())
	})
}

const bufferFor = (name) => {
	if (SOUNDS[name].file === undefined) {
		buffers[name] = buffers[name] ?? renderTones(name)
	}
	return buffers[name]
}

const startSource = (buffer, volume, loop = false) => {
	const source = audio().createBufferSource()
	const gain = audio().createGain()

	gain.gain.value = volume / 100
	source.buffer = buffer
	source.loop = loop
	source.connect(gain).connect(audio().destination)
	source.start()
	return source
}

let pressed = false

// Browsers only start audio during a press, and most sounds here start later, from a clock
// or a state. So the first press resumes the context and plays a silent sample, which is
// what Safari needs to really make sound rather than just report that it's running. Sounds
// wait for that press, or they'd all come out at once when it happened. Safari can also
// interrupt a context later, so a press wakes it again.
const wake = () => {
	if (pressed && context.state === "running") {
		return
	}

	pressed = true
	context.resume()
	startSource(context.createBuffer(1, 1, SAMPLE_RATE), 0)
}

const PRESSES = ["pointerdown", "mousedown", "mouseup", "click", "touchend", "keydown", "keyup"]

// A Speaker gets its own sound ready as soon as it appears, before anyone presses.
export const prepareAudio = (name) => {
	audio()
	PRESSES.forEach((press) => window.addEventListener(press, wake, { capture: true }))
	if (SOUNDS[name].file !== undefined) {
		decodeRecording(name)
	}
}

const VOICES_PER_SOUND = 3
const voices = {}

// `volume` is a percent, so sounds can be balanced against each other. A sound retriggered
// faster than it finishes cuts off its oldest voice, rather than piling up and getting loud.
export const playSound = (name, volume = 100) => {
	const buffer = bufferFor(name)
	if (!pressed || buffer === undefined) {
		return
	}

	voices[name] = voices[name] ?? []
	if (voices[name].length === VOICES_PER_SOUND) {
		voices[name].shift().stop()
	}

	const source = startSource(buffer, volume)
	source.onended = () => {
		voices[name] = voices[name].filter((voice) => voice !== source)
	}
	voices[name].push(source)
}

const loops = {}

export const stopLoop = (name) => {
	loops[name]?.stop()
	delete loops[name]
}

export const startLoop = (name, volume = 100) => {
	const buffer = bufferFor(name)
	stopLoop(name)
	if (pressed && buffer !== undefined) {
		loops[name] = startSource(buffer, volume, true)
	}
}
