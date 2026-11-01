import { MACHINE_CLOCK, busedPins, outputProps, pinsFor, splitBus } from "./parts"

export const startMachine = (machine) => ({ state: machine.initial, signals: {}, taken: null })

// A click lands between clock edges, so the next edge could test transitions before what the
// new state asserts has reached the parts, like a timer still reading 0. That edge is skipped.
export const jumpTo = (run, state) => ({ ...run, state, taken: null, jumped: true })

const clockSource = (machine) => machine.connections.find(({ to }) => to === MACHINE_CLOCK)?.from

const valueOf = (machine, value) => {
	return typeof value === "string" ? machine.constants.find(({ name }) => name === value)?.value : value
}

const COMPARE = {
	"<": (a, b) => a < b,
	"<=": (a, b) => a <= b,
	"=": (a, b) => a == b,
	"!=": (a, b) => a != b,
	">=": (a, b) => a >= b,
	">": (a, b) => a > b,
}

// A wire is tested as 0 or 1, and a bus by comparing its number, as { op, value }.
const passes = (machine, test, signal) => {
	if (typeof test !== "object") {
		return (signal === true ? 1 : 0) === test
	}
	return COMPARE[test.op](signal || 0, valueOf(machine, test.value))
}

const holds = (machine, transition, signals) => Object.entries(transition.on ?? {}).every(([terminal, test]) => {
	return passes(machine, test, signals[terminal])
})

// Transitions are tried in order, and the first whose conditions match is taken.
const matching = (machine, state, signals) => {
	return machine.transitions.find((transition) => transition.from === state && holds(machine, transition, signals))
}

// A part's output changed. The machine only moves on a rising edge of whatever drives its clock.
export const setSignal = (machine, run, terminal, value) => {
	const signals = { ...run.signals, [terminal]: value }
	const rising = terminal === clockSource(machine) && value && run.signals[terminal] !== true
	if (!rising) {
		return { ...run, signals }
	}
	if (run.jumped) {
		return { ...run, signals, jumped: false }
	}
	
	const transition = matching(machine, run.state, signals)
	return {
		state: transition?.to ?? run.state,
		signals,
		taken: transition?.id ?? null,
	}
}

// What's being asserted right now, as numbers by the pin they're asserted on.
export const machineAssertions = (machine, run) => {
	const { assert } = machine.machine === "moore"
		? machine.states.find((state) => state.id === run.state) ?? {}
		: matching(machine, run.state, run.signals) ?? {}
	
	return Object.fromEntries(Object.entries(assert ?? {}).map(([terminal, value]) => [terminal, valueOf(machine, value)]))
}

// A connection decides an input pin if it has one, and otherwise the current assertion.
// A pin with neither gets nothing, which is what lets an unconnected clock run.
export const machineProps = (machine, instance, setters, signals, assertions) => {
	const noops = outputProps(instance).map((prop) => [prop, () => {}])
	
	const pins = Object.entries(pinsFor(instance)).map(([prop, pin]) => {
		const terminal = `${instance.id}.${prop}`
		if (pin.dir === "out") {
			return [prop, setters[terminal]]
		}
		
		const source = machine.connections.find(({ to }) => to === terminal)?.from
		if (source) {
			return [prop, pin.bus ? signals[source] : signals[source] === true]
		}
		
		const value = assertions[terminal]
		return [prop, value === undefined || pin.bus ? value : value === 1]
	})
	
	// A connection or assertion on one bit of a bus goes over what the bus says for it.
	const bits = busedPins(instance).flatMap((name) => {
		const terminal = `${instance.id}.${name}`
		const source = machine.connections.find(({ to }) => to === terminal)?.from
		if (source) {
			return [[name, signals[source] === true]]
		}
		return assertions[terminal] === undefined ? [] : [[name, assertions[terminal] === 1]]
	})
	
	const split = splitBus(instance, {
		x: instance.at[0], y: instance.at[1], ...Object.fromEntries(noops), ...instance.props, ...Object.fromEntries(pins),
	})
	return { ...split, ...Object.fromEntries(bits) }
}
