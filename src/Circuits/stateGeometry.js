import { terminalName } from "./parts"

export const STATE_RADIUS = 30

const ARROW_LENGTH = 9
const CURVE_BEND = 36
const SAMPLES = 16

const quadratic = (a, control, b, t) => {
	const u = 1 - t
	return [
		u * u * a[0] + 2 * u * t * control[0] + t * t * b[0],
		u * u * a[1] + 2 * u * t * control[1] + t * t * b[1],
	]
}

const toward = ([x, y], [toX, toY], distance) => {
	const length = Math.hypot(toX - x, toY - y) || 1
	return [x + (toX - x) / length * distance, y + (toY - y) / length * distance]
}

const arrowHead = (tip, from) => {
	const [dx, dy] = [tip[0] - from[0], tip[1] - from[1]]
	const length = Math.hypot(dx, dy) || 1
	const [ux, uy] = [dx / length, dy / length]
	const base = [tip[0] - ux * ARROW_LENGTH, tip[1] - uy * ARROW_LENGTH]
	const half = ARROW_LENGTH / 2
	return `${tip} ${[base[0] - uy * half, base[1] + ux * half]} ${[base[0] + uy * half, base[1] - ux * half]}`
}

const selfLoop = ([x, y]) => {
	const start = [x - 16, y - STATE_RADIUS + 4]
	const end = [x + 16, y - STATE_RADIUS + 4]
	const lift = STATE_RADIUS + 54
	const [c1, c2] = [[x - 44, y - lift], [x + 44, y - lift]]
	
	return {
		path: `M${start} C${c1} ${c2} ${end}`,
		arrow: arrowHead(end, c2),
		label: [x, y - STATE_RADIUS - 46],
		samples: Array.from({ length: SAMPLES + 1 }, (_, i) => {
			const t = i / SAMPLES
			const u = 1 - t
			return [0, 1].map((k) => {
				return u * u * u * start[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * end[k]
			})
		}),
	}
}

// How a transition is drawn. A pair running both ways bows apart so they don't overlap.
export const transitionShape = (machine, transition) => {
	const center = (id) => machine.states.find((state) => state.id === id).at
	const a = center(transition.from)
	const b = center(transition.to)
	
	if (transition.from === transition.to) {
		return selfLoop(a)
	}
	
	const returns = machine.transitions.some((other) => other.from === transition.to && other.to === transition.from)
	const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
	const length = Math.hypot(dx, dy) || 1
	const bend = returns ? CURVE_BEND : 0
	const control = [(a[0] + b[0]) / 2 + dy / length * bend, (a[1] + b[1]) / 2 - dx / length * bend]
	const start = toward(a, control, STATE_RADIUS)
	const end = toward(b, control, STATE_RADIUS + 2)
	
	return {
		path: `M${start} Q${control} ${end}`,
		arrow: arrowHead(end, control),
		label: quadratic(start, control, end, .5),
		samples: Array.from({ length: SAMPLES + 1 }, (_, i) => quadratic(start, control, end, i / SAMPLES)),
	}
}

const OPERATORS = { "<=": "≤", ">=": "≥", "!=": "≠" }

const assignmentLines = (machine, values) => {
	return Object.entries(values ?? {}).map(([terminal, value]) => {
		const name = terminalName(machine, terminal)
		return typeof value === "object"
			? `${name}${OPERATORS[value.op] ?? value.op}${value.value}`
			: `${name}=${value}`
	})
}

export const transitionLabel = (machine, transition) => {
	const guard = assignmentLines(machine, transition.on).join(" ") || "any"
	const output = machine.machine === "mealy" ? assignmentLines(machine, transition.assert).join(" ") : ""
	return output === "" ? guard : `${guard} / ${output}`
}

export const stateOutputLines = (machine, state) => {
	return machine.machine === "moore" ? assignmentLines(machine, state.assert) : []
}

const TRANSITION_REACH = 8
const LABEL_REACH = [40, 12]

export const stateAt = (doc, [x, y]) => {
	return [...doc.states].reverse().find(({ at }) => Math.hypot(at[0] - x, at[1] - y) <= STATE_RADIUS)
}

export const transitionAt = (doc, [x, y]) => [...doc.transitions].reverse().find((transition) => {
	const { samples, label } = transitionShape(doc, transition)
	const onLabel = Math.abs(label[0] - x) <= LABEL_REACH[0] && Math.abs(label[1] - 5 - y) <= LABEL_REACH[1]
	return onLabel || samples.some(([sx, sy]) => Math.hypot(sx - x, sy - y) <= TRANSITION_REACH)
})
