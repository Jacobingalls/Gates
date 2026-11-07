import { Placement } from "../Components/Block"
import { Led } from "../Components/Outputs/Led"
import { TRAFFIC_VERSIONS, TrafficLight, trafficLightShape } from "../Components/Outputs/TrafficLight"
import { NumberDisplay, numberDisplayShape } from "../Components/Outputs/NumberDisplay"
import { SEVEN_SEGMENT_SIZE, SMALL_SCALE, SMALL_SEVEN_SEGMENT_SIZE, SevenSegment, hexSegments } from "../Components/Outputs/SevenSegment"
import { KeyboardButton } from "../Components/Buttons/KeyboardButton.jsx"
import { ToggleSwitch } from "../Components/Buttons/ToggleSwitch"
import { AndGate, NandGate } from "../Components/Gates/AndGates"
import { NotGate } from "../Components/Gates/NotGates"
import { OrGate, NorGate } from "../Components/Gates/OrGates"
import { XorGate, XnorGate } from "../Components/Gates/XorGates"
import { Bcd, bcdShape } from "../Components/Math/Bcd"
import { Comparator, comparatorShape } from "../Components/Math/Comparator"
import { Counter } from "../Components/Math/Counter"
import { Lut, lutShape } from "../Components/Math/Lut"
import { DFlipFlop } from "../Components/Memory/DFlipFlop"
import { DLatch } from "../Components/Memory/DLatch"
import { Register, registerShape } from "../Components/Memory/Register"
import { EightBitShiftRegister } from "../Components/Memory/ShiftRegisters"
import { SRLatch } from "../Components/Memory/SRLatch"
import { ToggleLatch } from "../Components/Memory/ToggleLatch"
import { Clock, clockShape } from "../Components/Timing/Clock"
import { Countdown, countdownShape } from "../Components/Timing/Countdown"
import { PedestrianController, pedestrianControllerShape } from "../Components/Timing/PedestrianController"
import { SPEAKER_SIZE, Speaker } from "../Components/Outputs/Speaker"
import { WalkLight, walkLightShape } from "../Components/Outputs/WalkLight"
import { Demux, Mux, demuxShape, muxShape } from "../Components/Math/Mux"
import { GRID } from "./grid"
import { pointOf } from "./wirePath"

const input = (x, y) => ({ at: [x, y], dir: "in" })
const output = (x, y) => ({ at: [x, y], dir: "out" })
const busOutput = (x, y) => ({ ...output(x, y), bus: true })

const SEGMENT_NAMES = ["a", "b", "c", "d", "e", "f", "g"]

const HEX_BITS = ["d8", "d4", "d2", "d1"]

const SevenSegmentPart = ({ x, y, mode, small, color, point, ...bits }) => {
	const isOn = (name) => bits[name] === true
	const number = HEX_BITS.reduce((total, name) => total * 2 + (isOn(name) ? 1 : 0), 0)
	const segments = mode === "hex" ? hexSegments(number) : SEGMENT_NAMES.map(isOn)
	return <SevenSegment x={x} y={y} segments={segments} scale={small ? SMALL_SCALE : 1} color={color} point={point === true} />
}

const gatePins = { input1: input(10, 10), input2: input(10, 30), output: output(50, 20) }
const gate = (title, Component, keywords) => ({
	title, Component, keywords, category: "Gates", icon: "gate", size: [50, 40], pins: gatePins,
})

const segmentBank = {
	prop: "segments", at: [0, 40],
	pins: Object.fromEntries(SEGMENT_NAMES.map((name, i) => [name, input(0, 10 + i * 10)])),
}

const hexBank = {
	prop: "value", at: [0, 40], highFirst: true, bused: HEX_BITS,
	pins: { d8: input(0, 20), d4: input(0, 30), d2: input(0, 50), d1: input(0, 60) },
}

const registerBank = {
	prop: "setValue", at: [100, 120],
	pins: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`setQ${i}`, output(100, 20 + i * 30)])),
}

const [SMALL_WIDTH, SMALL_HEIGHT] = SMALL_SEVEN_SEGMENT_SIZE

const topPin = (x) => ({ ...input(x, 0), side: "top" })
const bottomPin = (x) => ({ ...input(x, SMALL_HEIGHT), side: "bottom" })

// A small digit is too short for a pin per row, so its pins sit around it, each near what it lights.
const smallSegmentBank = {
	...segmentBank, at: [0, 20],
	pins: {
		a: topPin(10), b: input(SMALL_WIDTH, 10), c: input(SMALL_WIDTH, 20), d: bottomPin(10),
		e: input(0, 30), f: input(0, 10), g: input(0, 20),
	},
}

const smallHexBank = {
	...hexBank, at: [0, 20],
	pins: { d8: input(0, 10), d4: input(0, 20), d2: input(0, 30), d1: bottomPin(10) },
}

const SEVEN_SEGMENT_MODES = {
	segments: { title: "Segments", bank: segmentBank },
	hex: { title: "Hex Number", bank: hexBank },
}

const SMALL_SEVEN_SEGMENT_MODES = {
	segments: { title: "Segments", bank: smallSegmentBank },
	hex: { title: "Hex Number", bank: smallHexBank },
}

// The decimal point is on its own pin, beside it on the right, whichever input the part takes.
const pointPin = (x, y) => ({
	point: { ...input(x, y), optional: true, label: () => "Decimal Point" },
})

const sevenSegmentShape = ({ small }) => small
	? { size: SMALL_SEVEN_SEGMENT_SIZE, modes: SMALL_SEVEN_SEGMENT_MODES, pins: pointPin(SMALL_WIDTH, 30) }
	: { size: SEVEN_SEGMENT_SIZE, modes: SEVEN_SEGMENT_MODES, pins: pointPin(SEVEN_SEGMENT_SIZE[0], 70) }

const speakerShape = ({ small }) => {
	const [width, height] = SPEAKER_SIZE.map((length) => length * (small ? SMALL_SCALE : 1))
	
	return { size: [width, height], pins: { start: { ...input(0, height / 2), label: () => "Start" } } }
}

// Everything a diagram can place. `pins` are keyed by the part's React prop, and
// `origin` is where the part's box starts relative to the point it's drawn at.
// Parts with no `icon` show a generic chip in the editor's library.
//
// A part with `sized` works out its size and pins from an instance's props.
//
// An `optional` pin is left alone when a part connects itself, and a `clock` pin takes
// a state machine's clock. `label` names a pin that needs saying even on its own.
// A pin with `side` of "top" or "bottom" leaves through that edge rather than the nearer side.
//
// A `bank` is a set of pins an instance can gather onto one bus pin, called `prop`,
// which sits at `at` when it takes them all. `bused` is what's gathered by default, and
// `highFirst` makes the first pin the bus's top bit. Parts with `modes` pick their bank.
//
// `offFace` marks a block's pin that its face doesn't name, as the rest of a block's do.
//
// Sizes and pins are in whole grid steps, or the parts around them can't line up.
export const PARTS = {
	KeyboardButton: {
		title: "Button", Component: KeyboardButton, category: "Inputs & Outputs", icon: "button", keywords: "key switch input",
		size: [40, 40], pins: { output: output(40, 20) }, defaults: { keyboard: "1" }, html: true,
	},
	ToggleSwitch: {
		title: "Switch", Component: ToggleSwitch, category: "Inputs & Outputs", icon: "switch", keywords: "toggle latch key rocker input",
		size: [60, 40], pins: { output: output(60, 20) }, defaults: { keyboard: "1" }, html: true,
	},
	Led: {
		title: "Light", Component: Led, category: "Inputs & Outputs", icon: "light", keywords: "led lamp output",
		origin: [-10, -10], size: [20, 20], pins: { on: input(0, 0) },
	},
	TrafficLight: {
		title: "Traffic Light", Component: TrafficLight, category: "Inputs & Outputs", icon: "trafficLight",
		keywords: "red yellow green arrow left right turn signal output", sized: trafficLightShape,
		defaults: { mode: "standard" }, modeLabel: "Version", modes: TRAFFIC_VERSIONS,
	},
	WalkLight: {
		title: "Walk Light", Component: WalkLight, category: "Inputs & Outputs", icon: "walkLight",
		keywords: "wait pedestrian crossing countdown timer output", sized: walkLightShape, defaults: { width: 7, timer: true },
	},
	Speaker: {
		title: "Speaker", Component: Speaker, category: "Inputs & Outputs", icon: "speaker", keywords: "sound audio beep tone chirp output",
		sized: speakerShape, defaults: { sound: "buttonBeep", volume: 100, loop: false },
	},
	SevenSegment: {
		title: "Seven Segment", Component: SevenSegmentPart, category: "Inputs & Outputs", icon: "sevenSegment",
		keywords: "display digit hex number output", pins: {}, defaults: { mode: "segments" },
		modes: SEVEN_SEGMENT_MODES, sized: sevenSegmentShape,
	},
	Clock: {
		title: "Clock", Component: Clock, category: "Timing", icon: "clock", keywords: "oscillator frequency duty cycle pulse enable disable",
		sized: clockShape, defaults: { frequency: 1, duty: 50, controlType: "enable" },
	},
	Countdown: {
		title: "Countdown", Component: Countdown, category: "Timing", keywords: "down counter timer load zero reset clock",
		sized: countdownShape, defaults: { width: 7 },
	},
	PedestrianController: {
		title: "Pedestrian Controller", Component: PedestrianController, category: "Timing",
		keywords: "crossing walk wait light traffic signal timer request state machine",
		sized: pedestrianControllerShape, defaults: { width: 7, walkTime: 5, flashTime: 8 },
	},
	NumberDisplay: {
		title: "Number Display", Component: NumberDisplay, category: "Inputs & Outputs", icon: "sevenSegment",
		keywords: "decimal digits seven segment bcd output", sized: numberDisplayShape, defaults: { width: 8 },
	},
	AndGate: gate("And Gate", AndGate, "logic"),
	OrGate: gate("Or Gate", OrGate, "logic"),
	XorGate: gate("Xor Gate", XorGate, "logic exclusive"),
	NotGate: {
		title: "Not Gate", Component: NotGate, category: "Gates", icon: "gate", keywords: "logic inverter",
		size: [50, 40], pins: { input: input(0, 20), output: output(50, 20) },
	},
	NandGate: gate("Nand Gate", NandGate, "logic inverted"),
	NorGate: gate("Nor Gate", NorGate, "logic inverted"),
	XnorGate: gate("Xnor Gate", XnorGate, "logic inverted exclusive"),
	SRLatch: {
		title: "SR Latch", Component: SRLatch, category: "Memory", keywords: "set reset sequential",
		size: [100, 70], pins: { s: input(0, 20), r: input(0, 50), setQ: output(100, 20), setNotQ: output(100, 50) },
	},
	DLatch: {
		title: "D Latch", Component: DLatch, category: "Memory", keywords: "data enable sequential",
		size: [100, 70], pins: { d: input(0, 20), en: input(0, 50), setQ: output(100, 20), setNotQ: output(100, 50) },
	},
	DFlipFlop: {
		title: "D Flip-Flop", Component: DFlipFlop, category: "Memory", keywords: "data clock sequential",
		size: [100, 70], pins: { d: input(0, 20), clk: input(0, 50), setQ: output(100, 20), setNotQ: output(100, 50) },
	},
	ToggleLatch: {
		title: "Toggle Latch", Component: ToggleLatch, category: "Memory", keywords: "t flip-flop divide clock reset sequential",
		size: [100, 100], pins: {
			t: input(0, 20), clk: input(0, 50), reset: input(0, 80), setQ: output(100, 20), setNotQ: output(100, 50),
		},
	},
	Register: {
		title: "Register", Component: Register, category: "Memory", keywords: "store hold load latch binary value reset clock sequential",
		sized: registerShape, defaults: { width: 8 },
	},
	EightBitShiftRegister: {
		title: "8-Bit Shift Register", Component: EightBitShiftRegister, category: "Memory", keywords: "serial clock sequential",
		size: [100, 250], pins: { d: input(0, 20), clk: input(0, 50) }, bank: registerBank,
	},
	Bcd: {
		title: "BCD", Component: Bcd, category: "Math", keywords: "binary coded decimal double dabble digits",
		sized: bcdShape, defaults: { width: 8 },
	},
	Lut: {
		title: "LUT", Component: Lut, category: "Math", keywords: "lookup table memory rom decoder",
		sized: lutShape, defaults: { addressBits: 2, dataBits: 4, split: false, inputFormat: "bits", outputFormat: "bits" },
	},
	Comparator: {
		title: "Comparator", Component: Comparator, category: "Math", keywords: "compare less greater equal magnitude",
		sized: comparatorShape, defaults: { width: 8 },
	},
	Mux: {
		title: "Mux", Component: Mux, category: "Math", icon: "mux", keywords: "multiplexer data selector switch choose",
		sized: muxShape, defaults: { selectBits: 1, width: 1 },
	},
	Demux: {
		title: "Demux", Component: Demux, category: "Math", icon: "demux", keywords: "demultiplexer data distributor route choose",
		sized: demuxShape, defaults: { selectBits: 1, width: 1 },
	},
	Counter: {
		title: "Counter", Component: Counter, category: "Math", keywords: "clock modulo count",
		size: [140, 60], pins: { clk: input(0, 20), reset: input(0, 40), setValue: busOutput(140, 20), setOverflow: output(140, 40) },
		defaults: { modulo: 4 },
	},
}

export const shapeOf = ({ component, props, bused }) => {
	const part = PARTS[component]
	return part.sized === undefined ? part : { ...part, ...part.sized({ ...part.defaults, ...props, bused }) }
}

export const bankOf = (instance) => {
	const { bank, modes, defaults } = shapeOf(instance)
	return modes === undefined ? bank : modes[instance.props?.mode ?? defaults.mode].bank
}

// What an instance has ticked, which only makes a bus once there are two.
export const chosenBits = (instance) => {
	const bank = bankOf(instance)
	const chosen = instance.bused ?? bank?.bused ?? []
	return Object.keys(bank?.pins ?? {}).filter((name) => chosen.includes(name))
}

export const busedPins = (instance) => {
	const chosen = chosenBits(instance)
	return chosen.length < 2 ? [] : chosen
}

// The pins this instance has, once its mode and bus are taken into account.
export const pinsFor = (instance) => {
	const { pins } = shapeOf(instance)
	const bank = bankOf(instance)
	if (bank === undefined) {
		return pins
	}
	
	const bused = busedPins(instance)
	const separate = Object.entries(bank.pins).filter(([name]) => !bused.includes(name))
	if (bused.length === 0) {
		return { ...pins, ...Object.fromEntries(separate) }
	}
	
	const first = bank.pins[bused[0]]
	const at = separate.length === 0 ? bank.at : first.at
	return {
		...pins,
		...Object.fromEntries(separate),
		[bank.prop]: {
			at, dir: first.dir, bus: true, width: bused.length,
			...(bank.label === undefined ? {} : { label: () => bank.label }),
		},
	}
}

// Every prop a part's component might call, whichever of them are on a bus.
export const outputProps = (instance) => {
	const names = Object.keys({ ...bankOf(instance)?.pins, ...pinsFor(instance) })
	return names.filter((prop) => prop === "output" || prop.startsWith("set"))
}

// A bus can be wider than a number can hold, so its bits are worked out as big integers,
// and it stays an ordinary number for as long as it fits.
export const withBit = (value, bit, on) => {
	const mask = 1n << BigInt(bit)
	const whole = BigInt(value ?? 0)
	const next = on ? whole | mask : whole & ~mask
	return next <= Number.MAX_SAFE_INTEGER ? Number(next) : next
}

export const bitOf = (value, bit) => ((BigInt(value ?? 0) >> BigInt(bit)) & 1n) === 1n

// Parts only know their separate pins, so what's on a bus pin is split out for them.
export const splitBus = (instance, props) => {
	const bank = bankOf(instance)
	const bused = busedPins(instance)
	if (bused.length === 0 || props[bank.prop] === undefined) {
		return props
	}
	
	const bus = props[bank.prop]
	return bused.reduce((split, name, i) => {
		const bit = bank.highFirst ? bused.length - 1 - i : i
		const value = typeof bus === "function"
			? (on) => bus((current) => withBit(current, bit, on === true))
			: bitOf(bus, bit)
		return { ...split, [name]: value }
	}, props)
}

const pivotOf = (part) => {
	const [ox, oy] = part.origin ?? [0, 0]
	return [ox + part.size[0] / 2, oy + part.size[1] / 2]
}

const rotated = ([x, y], rotation) => {
	switch (rotation) {
		case 90: return [-y, x]
		case 180: return [-x, -y]
		case 270: return [y, -x]
		default: return [x, y]
	}
}

const isQuarterTurn = (instance) => (instance.rotation ?? 0) % 180 !== 0

// A box turns about its centre, which leaves it half a step off the grid if its sides differ
// by an odd number of steps. This puts it back. Parts that stay upright don't turn at all.
const turnNudge = (part, instance) => {
	const offGrid = (part.size[0] + part.size[1]) / 2 % GRID !== 0
	return isQuarterTurn(instance) && offGrid && !part.html ? GRID / 2 : 0
}

// Where a point on a part ends up in the diagram, once the instance is placed. A part that
// stays upright keeps its box, so what would turn with it runs around that box instead.
export const placePoint = (instance, [x, y]) => {
	const part = shapeOf(instance)
	const [px, py] = pivotOf(part)
	const flipped = [(x - px) * (instance.flipX ? -1 : 1), (y - py) * (instance.flipY ? -1 : 1)]
	const [dx, dy] = rotated(flipped, instance.rotation ?? 0)
	const stretch = part.html && isQuarterTurn(instance) ? part.size[0] / part.size[1] : 1
	const nudge = turnNudge(part, instance)
	return [instance.at[0] + px + dx * stretch + nudge, instance.at[1] + py + dy / stretch + nudge]
}

export const pinPoint = (instance, prop) => {
	return placePoint(instance, pinsFor(instance)[prop].at)
}

// The part's drawn box in diagram coordinates, as [left, top, right, bottom].
export const boxOf = (instance) => {
	const part = shapeOf(instance)
	const [ox, oy] = part.origin ?? [0, 0]
	const corners = [[ox, oy], [ox + part.size[0], oy + part.size[1]]].map((p) => placePoint(instance, p))
	const xs = corners.map((p) => p[0])
	const ys = corners.map((p) => p[1])
	return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

const TITLE_DROP = 20
const TITLE_CHAR_WIDTH = 7
const TITLE_HALF_HEIGHT = 10

// A block's title sits outside its box, and turns to the side with the block.
const titleBox = (instance) => {
	const part = shapeOf(instance)
	const length = part.title.length * TITLE_CHAR_WIDTH
	const [x, y] = placePoint(instance, [part.size[0] / 2, part.size[1] + TITLE_DROP])
	const [centerX] = placePoint(instance, pivotOf(part))
	
	const sideways = (instance.rotation ?? 0) % 180 !== 0
	const left = !sideways ? x - length / 2 : x < centerX ? x - length : x
	return [left, y - TITLE_HALF_HEIGHT, left + length, y + TITLE_HALF_HEIGHT]
}

const LABEL_ROOM = 22

const withLabelRoom = (instance, [left, top, right, bottom]) => {
	const length = (instance.name ?? PARTS[instance.component].title).length * TITLE_CHAR_WIDTH + TITLE_DROP
	return {
		top: [left, top - LABEL_ROOM, right, bottom],
		bottom: [left, top, right, bottom + LABEL_ROOM],
		left: [left - length, top, right, bottom],
		right: [left, top, right + length, bottom],
	}[instance.labelSide] ?? [left, top, right, bottom]
}

// Everything a part draws, for fitting a box around it.
export const extentOf = (instance) => {
	const box = boxOf(instance)
	if (instance.labelSide !== undefined) {
		return withLabelRoom(instance, box)
	}
	if (!BLOCK_CATEGORIES.includes(PARTS[instance.component].category)) {
		return box
	}
	
	const title = titleBox(instance)
	return [
		Math.min(box[0], title[0]), Math.min(box[1], title[1]),
		Math.max(box[2], title[2]), Math.max(box[3], title[3]),
	]
}

const placementTransform = (instance) => {
	const part = shapeOf(instance)
	const [px, py] = pivotOf(part)
	const nudge = turnNudge(part, instance)
	const [cx, cy] = [instance.at[0] + px, instance.at[1] + py]
	const scale = `scale(${instance.flipX ? -1 : 1},${instance.flipY ? -1 : 1})`
	return `translate(${cx + nudge},${cy + nudge}) rotate(${instance.rotation ?? 0}) ${scale} translate(${-cx},${-cy})`
}

const STUB_LENGTH = GRID / 2
const BLOCK_CATEGORIES = ["Memory", "Math", "Timing"]

// The short lead a pin shows, from past the edge of the part back to the pin.
export const stubOf = (part, pin) => {
	const [ox, oy] = part.origin ?? [0, 0]
	const [x, y] = pin.at
	if (pin.side !== undefined) {
		return [[x, pin.side === "top" ? oy - STUB_LENGTH : oy + part.size[1] + STUB_LENGTH], [x, y]]
	}
	
	const leftSide = x < ox + part.size[0] / 2
	return [[leftSide ? ox - STUB_LENGTH : ox + part.size[0] + STUB_LENGTH, y], [x, y]]
}

export const stubPath = ([[ax, ay], [bx, by]]) => `M${ax},${ay} L${bx},${by}`

const isWired = (nets, instance, prop) => {
	const at = pinPoint(instance, prop)
	
	return nets.some((net) => {
		const named = net.route?.length > 0 && net.connect.includes(`${instance.id}.${prop}`)
		const reaches = net.route?.some((line) => [line[0], line[line.length - 1]].some((end) => {
			const [x, y] = pointOf(end)
			return x === at[0] && y === at[1]
		}))
		return named || reaches
	})
}

// A wire on a pin takes the place of its stub, so these only mark the free pins.
export const PartStubs = ({ instance, nets }) => {
	const part = shapeOf(instance)
	
	return Object.entries(pinsFor(instance)).filter(([prop]) => !isWired(nets, instance, prop)).map(([prop, pin]) => {
		const stub = stubOf(part, pin).map((point) => placePoint(instance, point))
		return <path key={prop} className={pin.bus ? "bus-stub" : "gate-line"} d={stubPath(stub)} />
	})
}

export const pinLabel = (prop) => prop === "output" || prop === "on" ? "Signal" : prop.replace(/^set/, "")

const PIN_LABEL_GAP = GRID
const UNNAMED_PIN = pinLabel("output")

// Each pin's name, just inside the part and running in from the pin, for only the bus pins
// or only the wire pins. Pins a block's face already names don't need it, and neither does
// a pin that's only called Signal, which says nothing the part's own name doesn't.
export const PinLabels = ({ instance, bus }) => {
	const part = shapeOf(instance)
	const onFace = (pin) => BLOCK_CATEGORIES.includes(part.category) && pin.offFace !== true
	const pins = Object.entries(pinsFor(instance)).filter(([, pin]) => (pin.bus === true) === bus && !onFace(pin))
	const named = pins.map(([prop, pin]) => [prop, pin, pin.label?.(instance) ?? pinLabel(prop)])
	
	return named.filter(([, , name]) => name !== UNNAMED_PIN).map(([prop, pin, name]) => {
		const [outer, inner] = stubOf(part, pin).map((point) => placePoint(instance, point))
		const [dx, dy] = [Math.sign(outer[0] - inner[0]), Math.sign(outer[1] - inner[1])]
		const [x, y] = [inner[0] - dx * PIN_LABEL_GAP, inner[1] - dy * PIN_LABEL_GAP]
		
		return <text
			key={prop}
			className="editor-pin-label"
			x={x} y={y}
			textAnchor={dx + dy > 0 ? "end" : "start"}
			dominantBaseline="central"
			transform={dy === 0 ? undefined : `rotate(90,${x},${y})`}
		>
			{name}
		</text>
	})
}

const isOutputDevice = (instance) => {
	const pins = Object.values(pinsFor(instance))
	return PARTS[instance.component].category === "Inputs & Outputs" && pins.every((pin) => pin.dir === "in")
}

// A part's own name, or for an output device, the name of a net it's connected to.
export const partName = (doc, instance) => {
	if (instance.name !== undefined || !isOutputDevice(instance)) {
		return instance.name
	}
	return doc.nets.find((net) => {
		return net.name !== undefined && net.connect.some((terminal) => terminal.startsWith(`${instance.id}.`))
	})?.name
}

// The text beside a part, if any. `labelSide` picks a side or hides it, and once it's set a
// part with no name shows its title there, which takes over from a block's own title.
export const labelText = (doc, instance) => {
	if (instance.labelSide === "hidden") {
		return undefined
	}
	return partName(doc, instance) ?? (instance.labelSide === undefined ? undefined : PARTS[instance.component].title)
}

// The names parts give the one variable or bus they're connected to, by what they replace.
const deviceNames = (doc) => Object.fromEntries(doc.instances.flatMap((instance) => {
	const bound = Object.keys(pinsFor(instance)).map((prop) => instance.bind?.[prop]).filter(Boolean)
	return instance.name !== undefined && bound.length === 1 ? [[bound[0], instance.name]] : []
}))

// A table's columns as shown, which keep their variable's name unless a part overrides it.
export const shownColumns = (table) => {
	const names = deviceNames(table)
	return [...table.inputs, ...table.outputs].map((variable) => ({
		...variable,
		name: names[variable.name] ?? variable.name,
		...(variable.bus === undefined ? {} : { bus: names[variable.bus] ?? variable.bus }),
	}))
}

// The state machine's own clock, as the end of a connection.
export const MACHINE_CLOCK = "machine.clock"

// A pin as a person reads it: the part's name, plus the pin if the part has others like it.
export const terminalName = (doc, terminal) => {
	if (terminal === MACHINE_CLOCK) {
		return "Machine Clock"
	}
	
	const [id, prop] = terminal.split(".")
	const instance = doc.instances.find((candidate) => candidate.id === id)
	const pins = instance === undefined ? {} : pinsFor(instance)
	const pin = pins[prop] ?? (instance && bankOf(instance)?.pins[prop])
	if (pin === undefined) {
		return terminal
	}
	
	const name = instance.name ?? id
	if (pin.label !== undefined) {
		return `${name} ${pin.label(instance)}`
	}
	return Object.values(pins).filter(({ dir }) => dir === pin.dir).length === 1 ? name : `${name} ${pinLabel(prop)}`
}

export const PlacedPart = ({ instance, partProps }) => {
	const { Component, defaults } = PARTS[instance.component]
	const placement = {
		rotation: instance.rotation ?? 0,
		flipX: instance.flipX === true,
		flipY: instance.flipY === true,
		showTitle: instance.labelSide === undefined,
	}
	
	return <Placement.Provider value={placement}>
		<g transform={placementTransform(instance)}>
			<Component {...defaults} {...partProps} bused={instance.bused} />
		</g>
	</Placement.Provider>
}
