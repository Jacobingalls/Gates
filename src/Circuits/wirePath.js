const HOP_RADIUS = 10

const step = (point) => {
	if (point.hop === undefined) {
		return `L${point[0]},${point[1]}`
	}
	return `A${HOP_RADIUS},${HOP_RADIUS} 0 0 1 ${point.hop[0]},${point.hop[1]}`
}

export const wirePath = (route) => route.map(([[x, y], ...rest]) => {
	return [`M${x},${y}`, ...rest.map(step)].join(" ")
}).join(" ")
