import { busBits } from "../Circuits/Bench"
import { busedPins, pinLabel, pinsFor } from "../Circuits/parts"
import { fullRows } from "./truthTable"

export const MAX_INPUTS = 6
export const MAX_OUTPUTS = 16

const LIMITS = { inputs: MAX_INPUTS, outputs: MAX_OUTPUTS }

export const sideOf = (pin) => pin.dir === "out" ? "inputs" : "outputs"

// The buses on one side, in the order their first variables appear.
export const busesOn = (doc, side) => {
	const names = [...new Set(doc[side].map(({ bus }) => bus).filter((bus) => bus !== undefined))]
	return names.map((name) => ({ name, bits: busBits(doc[side], name) }))
}

const isTaken = (doc, side, name) => {
	return doc[side].some((variable) => variable.name === name || variable.bus === name)
}

const uniqueName = (doc, side, base) => {
	if (!isTaken(doc, side, base)) {
		return base
	}
	let n = 2
	while (isTaken(doc, side, `${base}${n}`)) {
		n += 1
	}
	return `${base}${n}`
}

const forEachBind = (doc, change) => ({
	...doc,
	instances: doc.instances.map((instance) => {
		if (instance.bind === undefined) {
			return instance
		}
		return { ...instance, bind: Object.fromEntries(Object.entries(instance.bind).map(([prop, bound]) => {
			return [prop, change(bound)]
		})) }
	}),
})

export const addVariable = (doc, side, base = side === "inputs" ? "in" : "out") => {
	const variables = doc[side]
	if (variables.length >= LIMITS[side]) {
		return doc
	}
	
	const added = { ...doc, [side]: [...variables, { name: uniqueName(doc, side, base) }] }
	return { ...added, rows: side === "inputs" ? fullRows(added, doc) : doc.rows.map((row) => [...row, 0]) }
}

// Names key everything that uses a variable, so a clash or a blank is refused.
export const renameVariable = (doc, side, from, to) => {
	if (to === "" || isTaken(doc, side, to)) {
		return doc
	}
	
	return forEachBind({
		...doc,
		[side]: doc[side].map((variable) => variable.name === from ? { ...variable, name: to } : variable),
	}, (name) => name === from ? to : name)
}

const withoutColumn = (doc, side, index) => {
	if (side === "inputs") {
		const source = { ...doc, rows: doc.rows.map((row) => row.filter((_, i) => i !== index)) }
		return { ...source, rows: fullRows(source) }
	}
	
	const column = doc.inputs.length + index
	return { ...doc, rows: doc.rows.map((row) => row.filter((_, i) => i !== column)) }
}

// A bus pin only keeps a bus of its size, so this runs whenever a bus changes.
const dropMisfits = (doc, side) => ({
	...doc,
	instances: doc.instances.map((instance) => {
		const fits = ([prop, bound]) => {
			const pin = pinsFor(instance)[prop]
			return !pin?.bus || sideOf(pin) !== side || busBits(doc[side], bound).length === pin.width
		}
		return instance.bind === undefined
			? instance
			: { ...instance, bind: Object.fromEntries(Object.entries(instance.bind).filter(fits)) }
	}),
})

const setBusOf = (doc, side, names, bus) => dropMisfits({
	...doc,
	[side]: doc[side].map((variable) => {
		if (!names.includes(variable.name)) {
			return variable
		}
		const { bus: _, ...rest } = variable
		return bus === undefined ? rest : { ...rest, bus }
	}),
}, side)

export const setVariableBus = (doc, side, name, bus) => setBusOf(doc, side, [name], bus)

export const addVariableBus = (doc, side, name) => setBusOf(doc, side, [name], uniqueName(doc, side, "bus"))

export const renameBus = (doc, side, from, to) => {
	if (to === "" || isTaken(doc, side, to)) {
		return doc
	}
	
	const renamed = {
		...doc,
		[side]: doc[side].map((variable) => variable.bus === from ? { ...variable, bus: to } : variable),
	}
	return forEachBind(renamed, (name) => name === from ? to : name)
}

export const removeVariable = (doc, side, name) => {
	const index = doc[side].findIndex((variable) => variable.name === name)
	const kept = { ...doc, [side]: doc[side].filter((variable) => variable.name !== name) }
	const trimmed = withoutColumn(kept, side, index)
	return dropMisfits(forEachBind(trimmed, (bound) => bound === name ? null : bound), side)
}

export const bindPin = (doc, id, prop, name) => ({
	...doc,
	instances: doc.instances.map((instance) => {
		return instance.id === id ? { ...instance, bind: { ...instance.bind, [prop]: name } } : instance
	}),
})

// Every variable a part is using, bus pins included.
const usedNames = (doc) => doc.instances.flatMap((instance) => {
	return Object.entries(pinsFor(instance)).flatMap(([prop, pin]) => {
		const bound = instance.bind?.[prop]
		return pin.bus ? busBits(doc[sideOf(pin)], bound) : [bound]
	})
})

const freeVariables = (doc, side) => {
	return doc[side].filter(({ name }) => !usedNames(doc).includes(name))
}

const bindBit = (doc, id, prop, pin) => {
	const side = sideOf(pin)
	const free = freeVariables(doc, side)[0]
	if (free !== undefined) {
		return bindPin(doc, id, prop, free.name)
	}
	
	const label = pinLabel(prop)
	const grown = addVariable(doc, side, label === "Signal" ? undefined : label.toLowerCase())
	return grown === doc ? doc : bindPin(grown, id, prop, grown[side][grown[side].length - 1].name)
}

const isBoundBus = (doc, bus) => doc.instances.some((instance) => Object.entries(pinsFor(instance)).some(([prop, pin]) => {
	return pin.bus && instance.bind?.[prop] === bus
}))

// Uses a free bus of the right size if there is one, and otherwise gathers free
// variables into a new bus, adding any it's short of.
export const bindBus = (doc, id, prop) => {
	const instance = doc.instances.find((candidate) => candidate.id === id)
	const pin = pinsFor(instance)[prop]
	const side = sideOf(pin)
	
	const ready = busesOn(doc, side).find(({ name, bits }) => bits.length === pin.width && !isBoundBus(doc, name))
	if (ready !== undefined) {
		return bindPin(doc, id, prop, ready.name)
	}
	
	const bits = busedPins(instance)
	const names = Array.from({ length: pin.width }, (_, i) => bits[i] ? pinLabel(bits[i]).toLowerCase() : `${prop}${i}`)
	const grown = names.reduce((current, name) => {
		const spare = freeVariables(current, side).filter(({ bus }) => bus === undefined).length
		return spare >= pin.width ? current : addVariable(current, side, name)
	}, doc)
	
	const chosen = freeVariables(grown, side).filter(({ bus }) => bus === undefined).slice(0, pin.width)
	if (chosen.length < pin.width) {
		return doc
	}
	
	const bus = uniqueName(grown, side, prop)
	return bindPin(setBusOf(grown, side, chosen.map(({ name }) => name), bus), id, prop, bus)
}

// A part dropped in connects to free variables, and adds any it's still short of,
// so a display works straight away. Every choice can be changed afterwards.
export const autoBind = (doc, id) => {
	const instance = doc.instances.find((candidate) => candidate.id === id)
	
	return Object.entries(pinsFor(instance)).reduce((current, [prop, pin]) => {
		if (pin.optional) {
			return current
		}
		return pin.bus ? bindBus(current, id, prop) : bindBit(current, id, prop, pin)
	}, doc)
}

export const bindingLabel = (instance) => {
	const names = Object.values(instance.bind ?? {}).filter((name) => name !== null && name !== undefined)
	return names.join(" ")
}
