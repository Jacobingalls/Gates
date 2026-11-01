import { MACHINE_CLOCK, bankOf, busedPins, pinsFor } from "../Circuits/parts"
import { snapPoint } from "./circuit"

export const blankMachine = () => ({
	format: 1,
	kind: "stateMachine",
	machine: "moore",
	size: [600, 300],
	instances: [
		{ id: "button_1", component: "KeyboardButton", at: [10, 30], props: { keyboard: "0" } },
		{ id: "button_2", component: "KeyboardButton", at: [10, 80], props: { keyboard: "1" } },
		{ id: "light_1", component: "Led", at: [570, 50] },
	],
	nets: [],
	connections: [{ from: "button_1.output", to: MACHINE_CLOCK }],
	constants: [],
	initial: null,
	states: [],
	transitions: [],
})

const nextId = (items, prefix) => {
	let n = 1
	while (items.some((item) => item.id === `${prefix}${n}`)) {
		n += 1
	}
	return `${prefix}${n}`
}

const updateList = (doc, list, id, change) => ({
	...doc,
	[list]: doc[list].map((item) => item.id === id ? { ...item, ...change } : item),
})

export const addState = (doc, at) => {
	const id = nextId(doc.states, "s")
	const state = { id, name: id.toUpperCase(), at: snapPoint(at) }
	return { id, doc: { ...doc, states: [...doc.states, state], initial: doc.initial ?? id } }
}

export const updateState = (doc, id, change) => updateList(doc, "states", id, change)

export const addTransition = (doc, from, to) => {
	const id = nextId(doc.transitions, "t")
	return { id, doc: { ...doc, transitions: [...doc.transitions, { id, from, to, on: {} }] } }
}

const assign = (values, name, value) => {
	const { [name]: _, ...others } = values ?? {}
	return value === undefined ? others : { ...others, [name]: value }
}

export const setGuard = (doc, id, terminal, value) => {
	const transition = doc.transitions.find((candidate) => candidate.id === id)
	return updateList(doc, "transitions", id, { on: assign(transition.on, terminal, value) })
}

const pinsWhere = (doc, wanted) => doc.instances.flatMap((instance) => {
	return Object.entries(pinsFor(instance)).filter(([, pin]) => wanted(pin)).map(([prop, pin]) => ({
		terminal: `${instance.id}.${prop}`, pin,
	}))
})

const isDriven = (doc, terminal) => doc.connections.some(({ to }) => to === terminal)

// Every input that can be driven: the pins, and each bit of a bus input on its own, unless
// a connection already drives that whole bus.
const inputPins = (doc) => {
	const bits = doc.instances.flatMap((instance) => {
		const bank = bankOf(instance)
		const whole = `${instance.id}.${bank?.prop}`
		if (bank === undefined || pinsFor(instance)[bank.prop]?.dir !== "in" || isDriven(doc, whole)) {
			return []
		}
		return busedPins(instance).map((name) => ({ terminal: `${instance.id}.${name}`, pin: bank.pins[name] }))
	})
	return [...pinsWhere(doc, ({ dir }) => dir === "in"), ...bits]
}

export const connectionSources = (doc) => pinsWhere(doc, ({ dir }) => dir === "out").map(({ terminal }) => terminal)

const sourcePin = (doc, terminal) => pinsWhere(doc, ({ dir }) => dir === "out").find((pin) => pin.terminal === terminal)?.pin

// Where a connection can end: a pin of the same size as its start, with no other
// connection on it. Only a single wire can drive the machine's clock.
export const connectionTargets = (doc, connection) => {
	const source = sourcePin(doc, connection.from)
	const sameSize = (width) => source.width === undefined || width === undefined || source.width === width
	const fits = ({ bus, width }) => source === undefined || (bus ? source.bus && sameSize(width) : !source.bus)
	const free = inputPins(doc).filter(({ pin }) => fits(pin)).map(({ terminal }) => terminal)
	const clock = source?.bus ? [] : [MACHINE_CLOCK]
	return [...clock, ...free].filter((terminal) => terminal === connection.to || !isDriven(doc, terminal))
}

export const addConnection = (doc) => ({ ...doc, connections: [...doc.connections, { from: "", to: "" }] })

// A new start can leave the end the wrong size, which then has to be chosen again.
export const updateConnection = (doc, index, change) => {
	const connections = doc.connections.map((connection, i) => {
		if (i !== index) {
			return connection
		}
		const next = { ...connection, ...change }
		return next.to === "" || connectionTargets(doc, next).includes(next.to) ? next : { ...next, to: "" }
	})
	return pruneMachine({ ...doc, connections })
}

export const removeConnection = (doc, index) => ({
	...doc,
	connections: doc.connections.filter((_, i) => i !== index),
})

// Every pin a state can assert: part inputs that no connection is already driving.
export const assertionTargets = (doc) => inputPins(doc).filter(({ terminal }) => !isDriven(doc, terminal))

// A bus pin with no set size, like a Counter's output, takes anything.
export const fitsPin = (doc, value, pin) => {
	const number = typeof value === "string" ? doc.constants.find(({ name }) => name === value)?.value : value
	return number !== undefined && (pin.bus && pin.width === undefined || number < 2 ** (pin.width ?? 1))
}

const firstValue = (doc, pin) => {
	if (!pin.bus) {
		return 1
	}
	return doc.constants.find(({ name }) => fitsPin(doc, name, pin))?.name ?? 0
}

// What a transition can test: every output, except whatever is clocking the machine.
export const conditionSources = (doc) => {
	const clock = doc.connections.find(({ to }) => to === MACHINE_CLOCK)?.from
	return pinsWhere(doc, ({ dir }) => dir === "out").filter(({ terminal }) => terminal !== clock)
}

export const addAssertion = (doc, list, id) => {
	const item = doc[list].find((candidate) => candidate.id === id)
	const target = assertionTargets(doc).find(({ terminal }) => item.assert?.[terminal] === undefined)
	if (target === undefined) {
		return doc
	}
	return updateList(doc, list, id, { assert: { ...item.assert, [target.terminal]: firstValue(doc, target.pin) } })
}

export const setAssertion = (doc, list, id, terminal, value) => {
	const item = doc[list].find((candidate) => candidate.id === id)
	return updateList(doc, list, id, { assert: { ...item.assert, [terminal]: value } })
}

// Keeps the row where it is, and starts it on a value the new pin can take.
export const moveAssertion = (doc, list, id, from, to) => {
	const item = doc[list].find((candidate) => candidate.id === id)
	const { pin } = assertionTargets(doc).find(({ terminal }) => terminal === to)
	const entries = Object.entries(item.assert).map(([terminal, value]) => {
		return terminal === from ? [to, fitsPin(doc, value, pin) ? value : firstValue(doc, pin)] : [terminal, value]
	})
	return updateList(doc, list, id, { assert: Object.fromEntries(entries) })
}

export const removeAssertion = (doc, list, id, terminal) => {
	const { assert } = doc[list].find((candidate) => candidate.id === id)
	const { [terminal]: _, ...rest } = assert
	return updateList(doc, list, id, { assert: rest })
}

const onEachItem = (doc, change) => ({
	...doc,
	states: doc.states.map(change),
	transitions: doc.transitions.map(change),
})

const filteredKeys = (values, keeps) => Object.fromEntries(Object.entries(values).filter(keeps))

// Whatever refers to a pin or constant that's gone, or that a pin can no longer hold, comes off.
export const pruneMachine = (doc) => {
	if (doc.kind !== "stateMachine") {
		return doc
	}
	
	const sources = connectionSources(doc)
	const connections = doc.connections.filter(({ from, to }) => {
		const fitting = connectionTargets({ ...doc, connections: [] }, { from })
		return (from === "" || sources.includes(from)) && (to === "" || fitting.includes(to))
	})
	const kept = { ...doc, connections }
	const targets = assertionTargets(kept)
	
	const keepsAssertion = ([terminal, value]) => {
		const target = targets.find((candidate) => candidate.terminal === terminal)
		return target !== undefined && fitsPin(doc, value, target.pin)
	}
	
	const keepsCondition = ([terminal, test]) => {
		const known = typeof test.value !== "string" || doc.constants.some(({ name }) => name === test.value)
		return sources.includes(terminal) && known
	}
	
	return onEachItem(kept, (item) => ({
		...item,
		...(item.assert ? { assert: filteredKeys(item.assert, keepsAssertion) } : {}),
		...(item.on ? { on: filteredKeys(item.on, keepsCondition) } : {}),
	}))
}

const renamedKeys = (values, rename) => Object.fromEntries(Object.entries(values).map(([key, value]) => [rename(key), value]))

// Carries a part's new id through everything that names its pins.
export const renameTerminals = (doc, from, to) => {
	if (doc.kind !== "stateMachine") {
		return doc
	}
	
	const rename = (terminal) => {
		const [owner, prop] = terminal.split(".")
		return owner === from ? `${to}.${prop}` : terminal
	}
	
	return onEachItem({
		...doc,
		connections: doc.connections.map((connection) => ({ from: rename(connection.from), to: rename(connection.to) })),
	}, (item) => ({
		...item,
		...(item.assert ? { assert: renamedKeys(item.assert, rename) } : {}),
		...(item.on ? { on: renamedKeys(item.on, rename) } : {}),
	}))
}

export const addConstant = (doc) => {
	let [name, n] = ["constant", 1]
	while (doc.constants.some((constant) => constant.name === name)) {
		n += 1
		name = `constant${n}`
	}
	return { ...doc, constants: [...doc.constants, { name, value: 0 }] }
}

export const setConstantValue = (doc, name, value) => pruneMachine({
	...doc,
	constants: doc.constants.map((constant) => constant.name === name ? { ...constant, value } : constant),
})

export const renameConstant = (doc, from, to) => {
	if (to === "" || doc.constants.some(({ name }) => name === to)) {
		return doc
	}
	
	const constants = doc.constants.map((constant) => constant.name === from ? { ...constant, name: to } : constant)
	const renamedTest = (test) => test?.value === from ? { ...test, value: to } : test
	const renamedValues = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => {
		return [key, value === from ? to : renamedTest(value)]
	}))
	
	return onEachItem({ ...doc, constants }, (item) => ({
		...item,
		...(item.assert ? { assert: renamedValues(item.assert) } : {}),
		...(item.on ? { on: renamedValues(item.on) } : {}),
	}))
}

export const removeConstant = (doc, name) => pruneMachine({
	...doc,
	constants: doc.constants.filter((constant) => constant.name !== name),
})

// A dropped Clock takes over driving the machine.
export const placeInMachine = (doc, id) => {
	const instance = doc.instances.find((candidate) => candidate.id === id)
	const clockPin = Object.entries(pinsFor(instance)).find(([, pin]) => pin.clock)
	if (clockPin === undefined) {
		return doc
	}
	
	const others = doc.connections.filter(({ to }) => to !== MACHINE_CLOCK)
	return { ...doc, connections: [...others, { from: `${id}.${clockPin[0]}`, to: MACHINE_CLOCK }] }
}

const withoutAssertions = ({ assert, ...rest }) => rest

// Assertions live on states in a Moore machine and on transitions in a Mealy one, so
// switching drops whichever no longer applies.
export const setMachineType = (doc, machine) => ({
	...doc,
	machine,
	states: machine === "moore" ? doc.states : doc.states.map(withoutAssertions),
	transitions: machine === "mealy" ? doc.transitions : doc.transitions.map(withoutAssertions),
})

export const checkMachine = (doc) => {
	const ids = doc.states.map((state) => state.id)
	const known = doc.transitions.every(({ from, to }) => ids.includes(from) && ids.includes(to))
	const valid = ["moore", "mealy"].includes(doc.machine) && known && (doc.initial === null || ids.includes(doc.initial))
	
	if (doc.instances === undefined || doc.connections === undefined) {
		throw new Error("This state machine uses an older format.")
	}
	if (!valid) {
		throw new Error("This state machine file isn't valid.")
	}
	return pruneMachine({ ...doc, constants: doc.constants ?? [] })
}
