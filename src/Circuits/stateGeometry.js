import { terminalName } from "./parts"

export const STATE_RADIUS = 30

export const radiusOf = (state) => state.radius ?? STATE_RADIUS

const ARROW_LENGTH = 9
const CURVE_BEND = 36
const SAMPLES = 16
// How much of a move of its control points the middle of a self-loop follows.
const LOOP_PULL = .75

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

const selfLoop = (state, [bendX, bendY]) => {
	const [x, y] = state.at
	const radius = radiusOf(state)
	const scale = radius / STATE_RADIUS
	const start = [x - 16 * scale, y - radius + 4 * scale]
	const end = [x + 16 * scale, y - radius + 4 * scale]
	const lift = radius + 54
	const c1 = [x - 44 * scale + bendX, y - lift + bendY]
	const c2 = [x + 44 * scale + bendX, y - lift + bendY]
	const samples = Array.from({ length: SAMPLES + 1 }, (_, i) => {
		const t = i / SAMPLES
		const u = 1 - t
		return [0, 1].map((k) => {
			return u * u * u * start[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * end[k]
		})
	})
	
	return {
		path: `M${start} C${c1} ${c2} ${end}`,
		arrow: arrowHead(end, c2),
		label: [x + bendX * LOOP_PULL, y - radius - 46 + bendY * LOOP_PULL],
		handle: samples[SAMPLES / 2],
		samples,
	}
}

// Where a transition's curve is pulled toward, from the middle of the line between its states,
// so it keeps its shape as they move. `curve` sets this, and otherwise a pair running both
// ways bows apart so they don't overlap.
export const curveOf = (machine, transition) => {
	if (transition.curve !== undefined || transition.from === transition.to) {
		return transition.curve ?? [0, 0]
	}
	
	const center = (id) => machine.states.find((state) => state.id === id).at
	const a = center(transition.from)
	const b = center(transition.to)
	const returns = machine.transitions.some((other) => other.from === transition.to && other.to === transition.from)
	const bend = returns ? CURVE_BEND : 0
	const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
	const length = Math.hypot(dx, dy) || 1
	return [dy / length * bend, -dx / length * bend]
}

// How far `curve` has to move for a transition's handle to move one step.
export const curvePull = (transition) => transition.from === transition.to ? 1 / LOOP_PULL : 2

const shift = ([x, y], [dx, dy]) => [x + dx, y + dy]

// How a transition is drawn. `handle` is where the editor grabs its curve, and `labelOffset`
// moves its label from the middle of the line, so the label follows when the line moves.
export const transitionShape = (machine, transition) => {
	const stateOf = (id) => machine.states.find((state) => state.id === id)
	const from = stateOf(transition.from)
	const to = stateOf(transition.to)
	const curve = curveOf(machine, transition)
	const moved = (shape) => ({ ...shape, label: shift(shape.label, transition.labelOffset ?? [0, 0]) })
	
	if (transition.from === transition.to) {
		return moved(selfLoop(from, curve))
	}
	
	const [a, b] = [from.at, to.at]
	const control = shift([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], curve)
	const start = toward(a, control, radiusOf(from))
	const end = toward(b, control, radiusOf(to) + 2)
	const middle = quadratic(start, control, end, .5)
	
	return moved({
		path: `M${start} Q${control} ${end}`,
		arrow: arrowHead(end, control),
		label: middle,
		handle: middle,
		samples: Array.from({ length: SAMPLES + 1 }, (_, i) => quadratic(start, control, end, i / SAMPLES)),
	})
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

// What a transition's label says if it isn't given its own `label`.
export const automaticLabel = (machine, transition) => {
	const guard = assignmentLines(machine, transition.on).join(" ") || "any"
	const output = machine.machine === "mealy" ? assignmentLines(machine, transition.assert).join(" ") : ""
	return output === "" ? guard : `${guard} / ${output}`
}

export const transitionLabel = (machine, transition) => {
	return (transition.label ?? automaticLabel(machine, transition)).split("\n")
}

export const stateOutputLines = (machine, state) => {
	return machine.machine === "moore" ? assignmentLines(machine, state.assert) : []
}

const NAME_SIZE = 16
const SMALLEST_NAME_SIZE = 8
const NAME_SIZE_STEP = .5
const NAME_CHAR_WIDTH = .56
export const NAME_LINE_HEIGHT = 1.15
const NAME_MARGIN = 2

// Every way of breaking words into this many lines.
const arrangements = (words, count) => {
	if (count === 1) {
		return [[words.join(" ")]]
	}
	return words.slice(0, words.length - count + 1).flatMap((_, i) => {
		return arrangements(words.slice(i + 1), count - 1).map((rest) => [words.slice(0, i + 1).join(" "), ...rest])
	})
}

// A circle narrows away from its middle, so each line gets the width left at its far edge.
const fitsCircle = (lines, size, radius) => {
	const room = radius - NAME_MARGIN
	const height = size * NAME_LINE_HEIGHT
	
	return lines.every((line, i) => {
		const edge = Math.abs(i - (lines.length - 1) / 2) * height + height / 2
		return edge < room && line.length * size * NAME_CHAR_WIDTH / 2 <= Math.sqrt(room ** 2 - edge ** 2)
	})
}

const sizeFor = (lines, radius) => {
	for (let size = NAME_SIZE; size >= SMALLEST_NAME_SIZE; size -= NAME_SIZE_STEP) {
		if (fitsCircle(lines, size, radius)) {
			return size
		}
	}
	return 0
}

// A state's name as lines inside its circle, at the largest size any wrapping of it allows.
// A name that can't fit goes on the fewest lines at the smallest size, so it stays readable.
export const fitName = (name, radius) => {
	const words = name.split(/\s+/).filter(Boolean)
	const options = words.flatMap((_, i) => arrangements(words, i + 1)).map((lines) => ({ lines, size: sizeFor(lines, radius) }))
	const best = options.reduce((chosen, option) => option.size > chosen.size ? option : chosen, { lines: [name], size: 0 })
	return best.size === 0 ? { lines: words.length === 0 ? [] : [name], size: SMALLEST_NAME_SIZE } : best
}

const SUMMARY_LINE_LENGTH = 30

const wrapped = (text) => text.split(" ").reduce((lines, word) => {
	const last = lines[lines.length - 1]
	if (last === "" || `${last} ${word}`.length > SUMMARY_LINE_LENGTH) {
		return last === "" ? [...lines.slice(0, -1), word] : [...lines, word]
	}
	return [...lines.slice(0, -1), `${last} ${word}`]
}, [""])

// What's written under a state: its summary, kept short enough to sit between its
// neighbours, or else what it asserts.
export const stateCaption = (machine, state) => {
	return state.summary === undefined
		? stateOutputLines(machine, state)
		: state.summary.split("\n").flatMap(wrapped)
}

const TRANSITION_REACH = 8
const LABEL_REACH = [40, 12]
const LABEL_CHAR_REACH = 3
export const LABEL_LINE_HEIGHT = 13
export const LABEL_LIFT = 5

export const stateAt = (doc, [x, y]) => {
	return [...doc.states].reverse().find((state) => Math.hypot(state.at[0] - x, state.at[1] - y) <= radiusOf(state))
}

// Topmost first, so the label that's drawn over another is the one a press gets.
export const transitionLabelAt = (doc, [x, y]) => [...doc.transitions].reverse().find((transition) => {
	const { label } = transitionShape(doc, transition)
	const lines = transitionLabel(doc, transition)
	const reach = Math.max(LABEL_REACH[0], ...lines.map((line) => line.length * LABEL_CHAR_REACH))
	const bottom = label[1] - LABEL_LIFT
	const top = bottom - (lines.length - 1) * LABEL_LINE_HEIGHT
	return Math.abs(label[0] - x) <= reach && y >= top - LABEL_REACH[1] && y <= bottom + LABEL_REACH[1]
})

export const transitionAt = (doc, [x, y]) => [...doc.transitions].reverse().find((transition) => {
	return transitionShape(doc, transition).samples.some(([sx, sy]) => Math.hypot(sx - x, sy - y) <= TRANSITION_REACH)
})
