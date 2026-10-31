const HOP_RADIUS = 10

export const pointOf = (point) => point.hop ?? point

const step = (point) => {
	if (point.hop === undefined) {
		return `L${point[0]},${point[1]}`
	}
	return `A${HOP_RADIUS},${HOP_RADIUS} 0 0 1 ${point.hop[0]},${point.hop[1]}`
}

export const wirePath = (route) => route.map(([[x, y], ...rest]) => {
	return [`M${x},${y}`, ...rest.map(step)].join(" ")
}).join(" ")

const isBus = (net) => net.width !== undefined

// Straight runs only: a saved hop already has its own arc.
const straightRuns = (net) => (net.route ?? []).flatMap((line) => line.slice(1).flatMap((point, i) => {
	return point.hop === undefined ? [[pointOf(line[i]), point]] : []
}))

const between = (value, a, b) => value > Math.min(a, b) && value < Math.max(a, b)

// Which of two crossing runs lifts over the other: a wire goes over a bus, and
// otherwise the vertical run goes over the horizontal one.
const jumps = (net, other, vertical) => {
	if (isBus(net) !== isBus(other)) {
		return isBus(other)
	}
	return vertical
}

// Where one run has to jump, as distances along it from its start.
const jumpsAlong = ([a, b], net, nets) => {
	const vertical = a[0] === b[0]
	if (vertical === (a[1] === b[1])) {
		return []
	}
	
	const axis = vertical ? 1 : 0
	const across = 1 - axis
	
	const crossings = nets.filter((other) => other !== net && jumps(net, other, vertical)).flatMap((other) => {
		return straightRuns(other)
			.filter(([c, d]) => c[axis] === d[axis] && c[across] !== d[across])
			.filter(([c, d]) => between(c[axis], a[axis], b[axis]) && between(a[across], c[across], d[across]))
			.map(([c]) => Math.abs(c[axis] - a[axis]))
	})
	
	return [...new Set(crossings)].sort((x, y) => x - y)
}

const runWithJumps = (a, b, net, nets) => {
	const length = Math.hypot(b[0] - a[0], b[1] - a[1])
	const [stepX, stepY] = [(b[0] - a[0]) / length, (b[1] - a[1]) / length]
	const along = (distance) => `${a[0] + stepX * distance},${a[1] + stepY * distance}`
	const sweep = stepX + stepY > 0 ? 1 : 0
	
	return jumpsAlong([a, b], net, nets).flatMap((distance) => {
		const radius = Math.min(HOP_RADIUS, distance, length - distance)
		return [
			`L${along(distance - radius)}`,
			`A${radius},${radius} 0 0 ${sweep} ${along(distance + radius)}`,
		]
	})
}

// Draws a net with arcs wherever it has to lift over another one.
export const netPath = (net, nets) => net.route.map((line) => {
	const [[x, y], ...rest] = line
	
	const steps = rest.flatMap((point, i) => {
		const from = pointOf(line[i])
		return point.hop === undefined
			? [...runWithJumps(from, point, net, nets), step(point)]
			: [step(point)]
	})
	
	return [`M${x},${y}`, ...steps].join(" ")
}).join(" ")

// Where a bus shows its width: its saved `tick`, or the middle of its longest run.
export const busTick = (net) => {
	if (net.tick !== undefined) {
		return net.tick
	}
	
	const segments = net.route.flatMap((line) => line.slice(1).map((point, i) => {
		const [ax, ay] = pointOf(line[i])
		const [bx, by] = pointOf(point)
		return { middle: [(ax + bx) / 2, (ay + by) / 2], length: Math.hypot(bx - ax, by - ay) }
	}))
	
	return segments.reduce((longest, s) => s.length > longest.length ? s : longest).middle
}

// Which side of a tapped bus the wire leaves on, so its bit name sits beside it.
export const tapLeavesRight = (net, tap) => {
	const line = net.route.find((candidate) => {
		return [candidate[0], candidate[candidate.length - 1]].some((end) => {
			const [x, y] = pointOf(end)
			return x === tap.at[0] && y === tap.at[1]
		})
	})
	
	if (line === undefined) {
		return false
	}
	
	const [startX] = pointOf(line[0])
	const [endX] = pointOf(line[line.length - 1])
	return (startX === tap.at[0] ? endX : startX) > tap.at[0]
}
