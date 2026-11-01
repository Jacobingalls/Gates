import { bankOf, pinsFor } from "../Circuits/parts"
import { blankCircuit, checkCircuit, finishedCircuit, formatDocument } from "./circuit"
import { blankMachine, checkMachine } from "./stateMachine"
import { blankTable, checkTable } from "./truthTable"

// The Hex Digit became a mode of the Seven Segment, and a pin with several bits used
// to list its variables, which is the same as separate pins.
const upgradeInstance = (instance) => {
	const part = instance.component === "HexDigit"
		? { ...instance, component: "SevenSegment", props: { mode: "hex" } }
		: instance
	
	const { value, ...bind } = part.bind ?? {}
	if (!Array.isArray(value)) {
		return part
	}
	
	const pins = Object.keys(bankOf(part)?.pins ?? {}).map((name, i) => [name, value[i]])
	return { ...part, bused: [], bind: { ...bind, ...Object.fromEntries(pins) } }
}

const upgradeTurnLight = (instance) => {
	if (instance.component !== "TurnTrafficLight") {
		return instance
	}
	return { ...instance, component: "TrafficLight", props: { mode: instance.props?.mode === "right" ? "fiveRight" : "fiveLeft" } }
}

// Traffic Lights used to take a bus, and now each lamp has its own input, so anything on
// the old pins comes off them.
const clearOldLightPins = (doc) => {
	const lights = (doc.instances ?? []).filter(({ component }) => component === "TrafficLight")
	const isStale = (terminal) => {
		const [id, prop] = terminal.split(".")
		const light = lights.find((candidate) => candidate.id === id)
		return light !== undefined && pinsFor(light)[prop] === undefined
	}
	
	return {
		...doc,
		instances: doc.instances?.map((instance) => {
			if (!lights.includes(instance)) {
				return instance
			}
			const { bused, bind, ...rest } = instance
			const kept = Object.entries(bind ?? {}).filter(([prop]) => pinsFor(instance)[prop] !== undefined)
			return kept.length === 0 ? rest : { ...rest, bind: Object.fromEntries(kept) }
		}),
		nets: doc.nets?.map((net) => ({ ...net, connect: net.connect.filter((terminal) => !isStale(terminal)) })),
	}
}

const parsedWith = (check) => (text) => {
	const doc = JSON.parse(text)
	return check(clearOldLightPins({ ...doc, instances: doc.instances?.map(upgradeTurnLight).map(upgradeInstance) }))
}

// What the editor needs to know about each kind of file.
export const KINDS = {
	circuit: { title: "Circuit", fileName: "Circuit.json", blank: blankCircuit, parse: parsedWith(checkCircuit) },
	truthTable: { title: "Truth Table", fileName: "TruthTable.json", blank: blankTable, parse: parsedWith(checkTable) },
	stateMachine: { title: "State Machine", fileName: "StateMachine.json", blank: blankMachine, parse: parsedWith(checkMachine) },
}

export const parseDocument = (text) => {
	const { kind } = JSON.parse(text)
	if (KINDS[kind] === undefined) {
		throw new Error(`The editor can't open a "${kind}" file.`)
	}
	return KINDS[kind].parse(text)
}

export const exportDocument = (doc) => formatDocument(finishedCircuit(doc))
