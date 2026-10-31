import { Placement } from "../Components/Block"
import { Led } from "../Components/Outputs/Led"
import { TrafficLight } from "../Components/Outputs/TrafficLight"
import { KeyboardButton } from "../Components/Buttons/KeyboardButton.jsx"
import { AndGate, NandGate } from "../Components/Gates/AndGates"
import { NotGate } from "../Components/Gates/NotGates"
import { OrGate, NorGate } from "../Components/Gates/OrGates"
import { XorGate, XnorGate } from "../Components/Gates/XorGates"
import { Counter } from "../Components/Math/Counter"
import { DFlipFlop } from "../Components/Memory/DFlipFlop"
import { DLatch } from "../Components/Memory/DLatch"
import { EightBitShiftRegister } from "../Components/Memory/ShiftRegisters"
import { SRLatch } from "../Components/Memory/SRLatch"
import { pointOf } from "./wirePath"

const input = (x, y) => ({ at: [x, y], dir: "in" })
const output = (x, y) => ({ at: [x, y], dir: "out" })
const busInput = (x, y) => ({ ...input(x, y), bus: true })
const busOutput = (x, y) => ({ ...output(x, y), bus: true })

const gatePins = { input1: input(10, 15), input2: input(10, 35), output: output(50, 25) }
const gate = (title, Component, keywords) => ({
	title, Component, keywords, category: "Gates", icon: "gate", size: [50, 50], pins: gatePins,
})

const registerOutputs = Object.fromEntries(
	Array.from({ length: 8 }, (_, i) => [`setQ${i}`, output(100, 25 + i * 30)])
)

// Everything a diagram can place. `pins` are keyed by the part's React prop, and
// `origin` is where the part's box starts relative to the point it's drawn at.
// Parts with no `icon` show a generic chip in the editor's library.
export const PARTS = {
	KeyboardButton: {
		title: "Button", Component: KeyboardButton, category: "Inputs & Outputs", icon: "button", keywords: "key switch input",
		size: [40, 40], pins: { output: output(40, 20) }, defaults: { keyboard: "1" },
	},
	Led: {
		title: "Light", Component: Led, category: "Inputs & Outputs", icon: "light", keywords: "led lamp output",
		origin: [-10, -10], size: [20, 20], pins: { on: input(0, 0) },
	},
	TrafficLight: {
		title: "Traffic Light", Component: TrafficLight, category: "Inputs & Outputs", icon: "trafficLight", keywords: "red yellow green output",
		size: [50, 100], pins: { value: busInput(0, 50) },
	},
	AndGate: gate("And Gate", AndGate, "logic"),
	OrGate: gate("Or Gate", OrGate, "logic"),
	XorGate: gate("Xor Gate", XorGate, "logic exclusive"),
	NotGate: {
		title: "Not Gate", Component: NotGate, category: "Gates", icon: "gate", keywords: "logic inverter",
		size: [50, 50], pins: { input: input(0, 25), output: output(45, 25) },
	},
	NandGate: gate("Nand Gate", NandGate, "logic inverted"),
	NorGate: gate("Nor Gate", NorGate, "logic inverted"),
	XnorGate: gate("Xnor Gate", XnorGate, "logic inverted exclusive"),
	SRLatch: {
		title: "SR Latch", Component: SRLatch, category: "Memory", keywords: "set reset sequential",
		size: [100, 80], pins: { s: input(0, 25), r: input(0, 55), setQ: output(100, 25), setNotQ: output(100, 55) },
	},
	DLatch: {
		title: "D Latch", Component: DLatch, category: "Memory", keywords: "data enable sequential",
		size: [100, 80], pins: { d: input(0, 25), en: input(0, 55), setQ: output(100, 25), setNotQ: output(100, 55) },
	},
	DFlipFlop: {
		title: "D Flip-Flop", Component: DFlipFlop, category: "Memory", keywords: "data clock sequential",
		size: [100, 80], pins: { d: input(0, 25), clk: input(0, 55), setQ: output(100, 25), setNotQ: output(100, 55) },
	},
	EightBitShiftRegister: {
		title: "8-Bit Shift Register", Component: EightBitShiftRegister, category: "Memory", keywords: "serial clock sequential",
		size: [100, 260], pins: { d: input(0, 25), clk: input(0, 55), ...registerOutputs },
	},
	Counter: {
		title: "Counter", Component: Counter, category: "Math", keywords: "clock modulo count",
		size: [140, 50], pins: { clk: input(0, 25), setValue: busOutput(140, 25) }, defaults: { modulo: 4 },
	},
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

// Where a point on a part ends up in the diagram, once the instance is placed.
export const placePoint = (instance, [x, y]) => {
	const [px, py] = pivotOf(PARTS[instance.component])
	const flipped = [(x - px) * (instance.flipX ? -1 : 1), (y - py) * (instance.flipY ? -1 : 1)]
	const [dx, dy] = rotated(flipped, instance.rotation ?? 0)
	return [instance.at[0] + px + dx, instance.at[1] + py + dy]
}

export const pinPoint = (instance, prop) => {
	return placePoint(instance, PARTS[instance.component].pins[prop].at)
}

// The part's drawn box in diagram coordinates, as [left, top, right, bottom].
export const boxOf = (instance) => {
	const part = PARTS[instance.component]
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
	const part = PARTS[instance.component]
	const length = part.title.length * TITLE_CHAR_WIDTH
	const [x, y] = placePoint(instance, [part.size[0] / 2, part.size[1] + TITLE_DROP])
	const [centerX] = placePoint(instance, pivotOf(part))
	
	const sideways = (instance.rotation ?? 0) % 180 !== 0
	const left = !sideways ? x - length / 2 : x < centerX ? x - length : x
	return [left, y - TITLE_HALF_HEIGHT, left + length, y + TITLE_HALF_HEIGHT]
}

// Everything a part draws, for fitting a box around it.
export const extentOf = (instance) => {
	const box = boxOf(instance)
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
	const [px, py] = pivotOf(PARTS[instance.component])
	const [cx, cy] = [instance.at[0] + px, instance.at[1] + py]
	const scale = `scale(${instance.flipX ? -1 : 1},${instance.flipY ? -1 : 1})`
	return `translate(${cx},${cy}) rotate(${instance.rotation ?? 0}) ${scale} translate(${-cx},${-cy})`
}

const STUB_LENGTH = 8
const BLOCK_CATEGORIES = ["Memory", "Math"]

// The short lead a pin shows, from past the edge of the part back to the pin.
export const stubOf = (part, pin) => {
	const [ox] = part.origin ?? [0, 0]
	const [x, y] = pin.at
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
	const part = PARTS[instance.component]
	
	return Object.entries(part.pins).filter(([prop]) => !isWired(nets, instance, prop)).map(([prop, pin]) => {
		const stub = stubOf(part, pin).map((point) => placePoint(instance, point))
		return <path key={prop} className={pin.bus ? "bus-stub" : "gate-line"} d={stubPath(stub)} />
	})
}

export const PlacedPart = ({ instance, partProps }) => {
	const { Component } = PARTS[instance.component]
	const placement = {
		rotation: instance.rotation ?? 0,
		flipX: instance.flipX === true,
		flipY: instance.flipY === true,
	}
	
	return <Placement.Provider value={placement}>
		<g transform={placementTransform(instance)}>
			<Component {...partProps} />
		</g>
	</Placement.Provider>
}
