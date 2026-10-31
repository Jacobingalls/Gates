const HOP_RADIUS = 10

const segments = (net) => (net.route ?? []).flatMap((line) => {
	return line.slice(1).map((point, i) => [line[i], point])
})

const isHorizontal = ([a, b]) => a[1] === b[1] && a[0] !== b[0]

const hopsAlong = (x, fromY, toY, horizontals) => {
	const low = Math.min(fromY, toY)
	const high = Math.max(fromY, toY)
	const hops = horizontals
		.filter(([a, b]) => {
			const y = a[1]
			return y > low && y < high && x > Math.min(a[0], b[0]) && x < Math.max(a[0], b[0])
		})
		.map(([a]) => a[1])
		.sort((a, b) => a - b)
	return fromY < toY ? hops : hops.reverse()
}

// Draws a net as an SVG path. Vertical runs hop over the horizontal runs of
// other nets, so a crossing can never be mistaken for a junction.
export const wirePath = (net, nets) => {
	const horizontals = nets
		.filter((other) => other !== net)
		.flatMap(segments)
		.filter(isHorizontal)
	
	return net.route.map((line) => {
		const [[startX, startY], ...rest] = line
		
		let previous = line[0]
		const steps = rest.flatMap(([x, y]) => {
			const hops = previous[0] === x ? hopsAlong(x, previous[1], y, horizontals) : []
			const direction = previous[1] < y ? 1 : -1
			const sweep = direction === 1 ? 1 : 0
			previous = [x, y]
			
			return [
				...hops.flatMap((hopY) => [
					`L${x},${hopY - direction * HOP_RADIUS}`,
					`A${HOP_RADIUS},${HOP_RADIUS} 0 0 ${sweep} ${x},${hopY + direction * HOP_RADIUS}`,
				]),
				`L${x},${y}`,
			]
		})
		
		return [`M${startX},${startY}`, ...steps].join(" ")
	}).join(" ")
}
