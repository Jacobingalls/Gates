import { PARTS, boxOf, extentOf, pinPoint, pinsFor, shapeOf } from "../Circuits/parts"
import { pruneMachine, renameTerminals } from "./stateMachine"
import { tableBox } from "./truthTable"
import { radiusOf, stateAt, transitionAt, transitionLabelAt, transitionShape } from "../Circuits/stateGeometry"
import { busTick, pointOf } from "../Circuits/wirePath"

export const GRID = 5
export const MIN_SIZE = 50
export const DEFAULT_BUS_WIDTH = 8

const PIN_SNAP = 10
const WIRE_SNAP = 6
const HANDLE_SNAP = 8
const FRAME_SNAP = 4
const BACKDROP_SIZE = [200, 150]
const TICK_REACH = 8
const FIT_MARGIN = 20
// A saved wire may stop short of a pin, hidden under the part it runs into.
const PIN_REACH = 60

export const snap = (value) => Math.round(value / GRID) * GRID
export const snapPoint = ([x, y]) => [snap(x), snap(y)]

const same = (a, b) => a[0] === b[0] && a[1] === b[1]
const movedTo = (point, xy) => point.hop === undefined ? xy : { hop: xy }

export const blankCircuit = () => ({
	format: 1, kind: "circuit", size: [600, 300], instances: [], nets: [], labels: [],
})

export const isBus = (net) => net.width !== undefined
export const originOf = (doc) => doc.origin ?? [0, 0]

const nextId = (doc, base) => {
	const taken = new Set([...doc.instances, ...doc.nets, ...(doc.labels ?? []), ...(doc.backdrops ?? [])].map((item) => item.id))
	let n = 1
	while (taken.has(`${base}_${n}`)) {
		n += 1
	}
	return `${base}_${n}`
}

const partBase = (component) => component.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()

export const addInstance = (doc, component, center) => {
	const part = shapeOf({ component })
	const [ox, oy] = part.origin ?? [0, 0]
	const at = snapPoint([center[0] - ox - part.size[0] / 2, center[1] - oy - part.size[1] / 2])
	const id = nextId(doc, partBase(component))
	const instance = { id, component, at, ...(part.defaults ? { props: { ...part.defaults } } : {}) }
	
	return { doc: { ...doc, instances: [...doc.instances, instance] }, id }
}

export const addLabel = (doc, at) => {
	const id = nextId(doc, "label")
	const label = { id, text: "Label", at: snapPoint(at) }
	return { doc: { ...doc, labels: [...(doc.labels ?? []), label] }, id }
}

export const addBackdrop = (doc, center) => {
	const id = nextId(doc, "backdrop")
	const at = snapPoint([center[0] - BACKDROP_SIZE[0] / 2, center[1] - BACKDROP_SIZE[1] / 2])
	return { doc: { ...doc, backdrops: [...(doc.backdrops ?? []), { id, at, size: BACKDROP_SIZE }] }, id }
}

const isJunction = (net, point, line) => net.route.some((other) => {
	return other !== line && [other[0], other[other.length - 1]].some((end) => same(pointOf(end), point))
})

// The end of a route that serves a pin. The pin may be hidden under its part.
const nearestEnd = (net, point) => {
	let nearest
	
	net.route.forEach((line, l) => [0, line.length - 1].forEach((p) => {
		const distance = Math.hypot(pointOf(line[p])[0] - point[0], pointOf(line[p])[1] - point[1])
		if (distance <= PIN_REACH && (nearest === undefined || distance < nearest.distance)) {
			nearest = { l, p, distance }
		}
	}))
	
	return nearest
}

// Moves the end of a net's route that serves a pin, keeping square corners square.
const followPin = (net, from, to) => {
	if (same(from, to) || net.route === undefined) {
		return net
	}
	
	const nearest = nearestEnd(net, from)
	if (nearest === undefined) {
		return net
	}
	
	const line = net.route[nearest.l]
	const atStart = nearest.p === 0
	const ordered = atStart ? [...line] : [...line].reverse()
	const end = pointOf(ordered[0])
	const moved = [end[0] + to[0] - from[0], end[1] + to[1] - from[1]]
	const next = pointOf(ordered[1])
	const horizontal = next[1] === end[1]
	const vertical = next[0] === end[0]
	const fixedNext = ordered.length === 2 || ordered[1].hop !== undefined || isJunction(net, next, line)
	
	let result
	if (!horizontal && !vertical) {
		result = [moved, ...ordered.slice(1)]
	} else if (!fixedNext) {
		const shifted = horizontal ? [next[0], moved[1]] : [moved[0], next[1]]
		result = [moved, shifted, ...ordered.slice(2)]
	} else if ((horizontal && moved[1] === next[1]) || (vertical && moved[0] === next[0])) {
		result = [moved, ...ordered.slice(1)]
	} else if (horizontal) {
		const middle = snap((moved[0] + next[0]) / 2)
		result = [moved, [middle, moved[1]], [middle, next[1]], ...ordered.slice(1)]
	} else {
		const middle = snap((moved[1] + next[1]) / 2)
		result = [moved, [moved[0], middle], [next[0], middle], ...ordered.slice(1)]
	}
	
	const route = [...net.route]
	route[nearest.l] = atStart ? result : result.reverse()
	return { ...net, route }
}

// Applies a change to an instance, bringing the wires on its pins along.
export const updateInstance = (doc, id, change) => {
	const before = doc.instances.find((instance) => instance.id === id)
	const after = { ...before, ...change }
	
	return {
		...doc,
		instances: doc.instances.map((instance) => instance === before ? after : instance),
		nets: doc.nets.map((net) => net.connect.reduce((current, terminal) => {
			const [owner, prop] = terminal.split(".")
			return owner === id ? followPin(current, pinPoint(before, prop), pinPoint(after, prop)) : current
		}, net)),
	}
}

// A new mode or bus can remove a pin, move it or change its size, and whatever was
// on it comes off. The rest stays connected. Pins named in `follows` are the same pin
// wherever they end up, so their wires go with them.
export const reconfigureInstance = (doc, id, change, follows = []) => {
	const before = doc.instances.find((instance) => instance.id === id)
	const { bused, ...others } = change
	const { bused: _, ...kept } = before
	const after = { ...kept, ...others, ...(bused === undefined ? {} : { bused }) }
	
	const [old, next] = [pinsFor(before), pinsFor(after)]
	const survives = (prop) => follows.includes(prop)
		|| (next[prop] !== undefined && same(next[prop].at, old[prop].at) && next[prop].width === old[prop].width)
	const stays = (terminal) => {
		const [owner, prop] = terminal.split(".")
		return owner !== id || survives(prop)
	}
	
	return pruneMachine({
		...doc,
		instances: doc.instances.map((instance) => {
			if (instance !== before) {
				return instance
			}
			if (after.bind === undefined) {
				return after
			}
			return { ...after, bind: Object.fromEntries(Object.entries(after.bind).filter(([prop]) => survives(prop))) }
		}),
		nets: doc.nets.map((net) => {
			const kept = { ...net, connect: net.connect.filter(stays) }
			return follows.reduce((current, prop) => {
				const onPin = current.connect.includes(`${id}.${prop}`)
				return onPin ? followPin(current, pinPoint(before, prop), pinPoint(after, prop)) : current
			}, kept)
		}),
	})
}

const pinOf = (doc, { instance, prop }) => pinsFor(doc.instances.find(({ id }) => id === instance))[prop]

// Pins set to a bus take only a bus of their size, and the rest take only a wire.
const pinRefusal = (pin, width) => {
	if (width === undefined) {
		return pin.width === undefined ? undefined : `That pin takes a ${pin.width}-bit bus. Draw a bus to it.`
	}
	if (pin.bus !== true) {
		return "That pin takes a wire. Put it on a bus in the side panel first."
	}
	return pin.width === undefined || pin.width === width
		? undefined
		: `That pin takes ${pin.width} bits, and this bus has ${width}.`
}

// Ids can't hold spaces, or the dot that ends one in a net's `connect`.
export const changeId = (doc, from, to) => {
	const taken = [...doc.instances, ...doc.nets, ...(doc.labels ?? [])].some((item) => item.id === to)
	if (taken || !/^[^\s.]+$/.test(to)) {
		return doc
	}
	
	const renamed = (id) => id === from ? to : id
	const terminal = (end) => {
		const [owner, prop] = end.split(".")
		return `${renamed(owner)}.${prop}`
	}
	
	return renameTerminals({
		...doc,
		instances: doc.instances.map((instance) => ({ ...instance, id: renamed(instance.id) })),
		nets: doc.nets.map((net) => ({
			...net,
			id: renamed(net.id),
			connect: net.connect.map(terminal),
			...(net.taps ? { taps: net.taps.map((tap) => ({ ...tap, bus: renamed(tap.bus) })) } : {}),
			...(net.inverseOf ? { inverseOf: renamed(net.inverseOf) } : {}),
		})),
	}, from, to)
}

export const rotateInstance = (doc, id) => {
	const instance = doc.instances.find((i) => i.id === id)
	return updateInstance(doc, id, { rotation: ((instance.rotation ?? 0) + 90) % 360 })
}

export const flipInstance = (doc, id, axis) => {
	const instance = doc.instances.find((i) => i.id === id)
	return updateInstance(doc, id, { [axis]: !instance[axis] })
}

export const updateItem = (doc, collection, id, change) => ({
	...doc,
	[collection]: doc[collection].map((item) => item.id === id ? { ...item, ...change } : item),
})

const removeItem = (doc, item) => {
	const { kind, id } = item
	
	if (kind === "frame" || kind === "table") {
		return doc
	}
	
	if (kind === "transition") {
		return { ...doc, transitions: doc.transitions.filter((transition) => transition.id !== id) }
	}
	
	if (kind === "state") {
		const states = doc.states.filter((state) => state.id !== id)
		return {
			...doc,
			states,
			initial: doc.initial === id ? states[0]?.id ?? null : doc.initial,
			transitions: doc.transitions.filter((transition) => transition.from !== id && transition.to !== id),
		}
	}
	
	if (kind === "segment") {
		return removeSegment(doc, item)
	}
	
	if (kind === "node") {
		const net = doc.nets.find((candidate) => candidate.id === id)
		const lines = net.route
			.map((line) => line.filter((point) => !same(pointOf(point), item.at)))
			.filter((line) => line.length > 1)
		return rewireNet(doc, net, lines.map(([first, ...rest]) => [pointOf(first), ...rest]))
	}
	
	if (kind === "point") {
		const net = doc.nets.find((candidate) => candidate.id === id)
		return updateItem(doc, "nets", id, { points: net.points.filter((point) => !same(point, item.at)) })
	}
	
	if (kind === "label") {
		return { ...doc, labels: doc.labels.filter((label) => label.id !== id) }
	}
	
	if (kind === "backdrop") {
		return { ...doc, backdrops: doc.backdrops.filter((backdrop) => backdrop.id !== id) }
	}
	
	if (kind === "instance") {
		return pruneMachine({
			...doc,
			instances: doc.instances.filter((instance) => instance.id !== id),
			nets: doc.nets.map((net) => ({
				...net,
				connect: net.connect.filter((terminal) => terminal.split(".")[0] !== id),
			})),
		})
	}
	
	return {
		...doc,
		nets: doc.nets.filter((net) => net.id !== id).map((net) => {
			const { taps, inverseOf, ...rest } = net
			const kept = (taps ?? []).filter((tap) => tap.bus !== id)
			return {
				...rest,
				...(kept.length > 0 ? { taps: kept } : {}),
				...(inverseOf !== undefined && inverseOf !== id ? { inverseOf } : {}),
			}
		}),
	}
}

export const removeSelection = (doc, selection) => selection.reduce(removeItem, doc)

export const allItems = (doc) => [
	...doc.instances.map(({ id }) => ({ kind: "instance", id })),
	...doc.nets.filter((net) => net.route?.length > 0).map(({ id }) => ({ kind: "net", id })),
	...(doc.labels ?? []).map(({ id }) => ({ kind: "label", id })),
	...(doc.backdrops ?? []).map(({ id }) => ({ kind: "backdrop", id })),
	...(doc.states ?? []).map(({ id }) => ({ kind: "state", id })),
	...(doc.at ? [{ kind: "table", id: "table" }] : []),
]

// Shrinks or grows the box to sit just around everything in the circuit.
export const fitFrame = (doc) => {
	const routed = doc.nets.flatMap((net) => net.route ?? []).flat().map(pointOf)
	const boxes = [
		...doc.instances.map(extentOf),
		...(doc.labels ?? []).map(labelBox),
		...(doc.backdrops ?? []).map(backdropBox),
		...routed.map(([x, y]) => [x, y, x, y]),
		...(doc.states ?? []).map(stateBox),
		...(doc.at ? [tableBox(doc)] : []),
	]
	
	if (boxes.length === 0) {
		return doc
	}
	
	const left = Math.floor((Math.min(...boxes.map((box) => box[0])) - FIT_MARGIN) / GRID) * GRID
	const top = Math.floor((Math.min(...boxes.map((box) => box[1])) - FIT_MARGIN) / GRID) * GRID
	const right = Math.ceil((Math.max(...boxes.map((box) => box[2])) + FIT_MARGIN) / GRID) * GRID
	const bottom = Math.ceil((Math.max(...boxes.map((box) => box[3])) + FIT_MARGIN) / GRID) * GRID
	
	return { ...doc, origin: [left, top], size: [Math.max(right - left, MIN_SIZE), Math.max(bottom - top, MIN_SIZE)] }
}

const labelBox = (label) => [
	label.at[0] - 3, label.at[1] - 14, label.at[0] + Math.max(label.text.length, 1) * 7 + 3, label.at[1] + 4,
]

export const backdropBox = ({ at: [x, y], size: [width, height] }) => [x, y, x + width, y + height]

const insideBox = ([left, top, right, bottom], [x1, y1, x2, y2]) => {
	return left >= x1 && top >= y1 && right <= x2 && bottom <= y2
}

const pointInBox = ([x, y], box) => insideBox([x, y, x, y], box)

const stateBox = (state) => {
	const [x, y] = state.at
	const radius = radiusOf(state)
	return [x - radius, y - radius, x + radius, y + radius]
}

// The corners of a net inside a box, leaving out any end that's on a pin or a bus:
// those belong to what they're connected to.
const nodesInBox = (doc, net, box) => {
	const free = net.route.flatMap((line, l) => line.flatMap((point, p) => {
		const at = pointOf(point)
		const isEnd = p === 0 || p === line.length - 1
		const held = isEnd && (servedBy(doc, net, l, p).length > 0 || net.taps?.some((tap) => same(tap.at, at)))
		return !held && pointInBox(at, box) ? [at] : []
	}))
	
	return [...new Map(free.map((at) => [String(at), at])).values()].map((at) => ({ kind: "node", id: net.id, at }))
}

// Everything inside a box dragged out on the canvas: parts and labels wholly inside,
// and with `wires`, whole wires inside it and the corners of wires that aren't.
export const itemsInBox = (doc, box, wires = true) => {
	const routed = wires ? doc.nets.filter((net) => net.route?.length > 0) : []
	const whole = (net) => net.route.flat().every((point) => pointInBox(pointOf(point), box))
	
	return [
		...doc.instances.filter((instance) => insideBox(boxOf(instance), box)).map(({ id }) => ({ kind: "instance", id })),
		...routed.filter(whole).map(({ id }) => ({ kind: "net", id })),
		...routed.filter((net) => !whole(net)).flatMap((net) => nodesInBox(doc, net, box)),
		...(doc.labels ?? []).filter((label) => insideBox(labelBox(label), box)).map(({ id }) => ({ kind: "label", id })),
		...(doc.backdrops ?? []).filter((backdrop) => insideBox(backdropBox(backdrop), box)).map(({ id }) => ({ kind: "backdrop", id })),
		...(doc.states ?? []).filter((state) => insideBox(stateBox(state), box)).map(({ id }) => ({ kind: "state", id })),
		...(doc.at && insideBox(tableBox(doc), box) ? [{ kind: "table", id: "table" }] : []),
	]
}

// Moves some corners of a net, keeping square corners square. A neighbor staying
// behind slides to keep up, unless it's the end of a line, which gets a new corner.
const moveNodes = (net, nodes, [dx, dy]) => {
	const moving = (point) => nodes.some((node) => same(node, pointOf(point)))
	const shifted = (point) => {
		const [x, y] = pointOf(point)
		return movedTo(point, [x + dx, y + dy])
	}
	
	const route = net.route.map((line) => {
		const points = line.map((point) => moving(point) ? shifted(point) : point)
		
		const slid = points.map((point, p) => {
			const neighbors = [p - 1, p + 1].filter((n) => n >= 0 && n < line.length && moving(line[n]))
			if (moving(line[p]) || point.hop !== undefined || p === 0 || p === line.length - 1 || neighbors.length === 0) {
				return point
			}
			const [x, y] = pointOf(line[p])
			const [nx, ny] = pointOf(line[neighbors[0]])
			return [nx === x ? x + dx : x, ny === y ? y + dy : y]
		})
		
		return slid.flatMap((point, p) => {
			const next = slid[p + 1]
			if (next === undefined || moving(line[p]) === moving(line[p + 1])) {
				return [point]
			}
			const isFreeEnd = p + 1 === line.length - 1 ? !moving(line[p + 1]) : p === 0 && !moving(line[p])
			if (!isFreeEnd) {
				return [point]
			}
			const [ax, ay] = pointOf(point)
			const [bx, by] = pointOf(next)
			const [oldAx, oldAy] = pointOf(line[p])
			const [oldBx, oldBy] = pointOf(line[p + 1])
			if (oldAy === oldBy && ay !== by) {
				const middle = snap((ax + bx) / 2)
				return [point, [middle, ay], [middle, by]]
			}
			if (oldAx === oldBx && ax !== bx) {
				const middle = snap((ay + by) / 2)
				return [point, [ax, middle], [bx, middle]]
			}
			return [point]
		})
	})
	
	const points = net.points?.map((point) => moving(point) ? [point[0] + dx, point[1] + dy] : point)
	return { ...net, route, ...(points ? { points } : {}) }
}

const idsOf = (selection, kind) => selection.filter((item) => item.kind === kind).map((item) => item.id)

export const rotateSelection = (doc, selection) => idsOf(selection, "instance").reduce(rotateInstance, doc)

export const flipSelection = (doc, selection, axis) => idsOf(selection, "instance").reduce((current, id) => {
	return flipInstance(current, id, axis)
}, doc)

const baseId = (id) => id.replace(/_\d+$/, "")

// Collects what a copy takes. A wire comes along when it's selected, or when
// everything it connects is being copied too.
export const copyItems = (doc, selection) => {
	const instanceIds = idsOf(selection, "instance")
	const wholeNets = [...idsOf(selection, "net"), ...idsOf(selection, "segment")]
	const copied = (terminal) => instanceIds.includes(terminal.split(".")[0])
	
	const stateIds = idsOf(selection, "state")
	
	return {
		instances: doc.instances.filter((instance) => instanceIds.includes(instance.id)),
		labels: (doc.labels ?? []).filter((label) => idsOf(selection, "label").includes(label.id)),
		backdrops: (doc.backdrops ?? []).filter((backdrop) => idsOf(selection, "backdrop").includes(backdrop.id)),
		nets: doc.nets.filter((net) => {
			return wholeNets.includes(net.id) || (net.connect.length > 1 && net.connect.every(copied))
		}),
		states: (doc.states ?? []).filter((state) => stateIds.includes(state.id)),
		transitions: (doc.transitions ?? []).filter(({ from, to }) => stateIds.includes(from) && stateIds.includes(to)),
	}
}

export const isEmptyCopy = ({ instances, labels, backdrops, nets, states }) => {
	return instances.length + labels.length + backdrops.length + nets.length + states.length === 0
}

// Adds a copy with fresh ids. Connections to anything outside the copy are dropped,
// since a pin can only be on one net.
export const pasteItems = (doc, copy, delta) => {
	const moved = shiftPoints({ ...copy, labels: copy.labels }, delta)
	let current = doc
	const ids = {}
	
	const place = (item, collection, base) => {
		ids[item.id] = nextId(current, base)
		const placed = { ...item, id: ids[item.id] }
		current = { ...current, [collection]: [...(current[collection] ?? []), placed] }
		return placed
	}
	
	const instances = moved.instances.map((instance) => place(instance, "instances", partBase(instance.component)))
	const labels = moved.labels.map((label) => place(label, "labels", "label"))
	const backdrops = moved.backdrops.map((backdrop) => place(backdrop, "backdrops", "backdrop"))
	const nets = moved.nets.map((net) => place(net, "nets", baseId(net.id)))
	
	const remapped = nets.map((net) => {
		const { taps, inverseOf, ...rest } = net
		const keptTaps = (taps ?? []).filter((tap) => ids[tap.bus] !== undefined)
			.map((tap) => ({ ...tap, bus: ids[tap.bus] }))
		return {
			...rest,
			connect: net.connect.flatMap((terminal) => {
				const [owner, prop] = terminal.split(".")
				return ids[owner] === undefined ? [] : [`${ids[owner]}.${prop}`]
			}),
			...(keptTaps.length > 0 ? { taps: keptTaps } : {}),
			...(ids[inverseOf] !== undefined ? { inverseOf: ids[inverseOf] } : {}),
		}
	})
	
	const pastedIds = remapped.map((net) => net.id)
	const stateIds = {}
	const taken = (list, prefix) => {
		let n = 1
		while (list.some((item) => item.id === `${prefix}${n}`)) {
			n += 1
		}
		return `${prefix}${n}`
	}
	
	const states = moved.states.reduce((placed, state) => {
		stateIds[state.id] = taken([...(doc.states ?? []), ...placed], "s")
		return [...placed, { ...state, id: stateIds[state.id] }]
	}, [])
	const transitions = moved.transitions.reduce((placed, transition) => {
		const id = taken([...(doc.transitions ?? []), ...placed], "t")
		return [...placed, { ...transition, id, from: stateIds[transition.from], to: stateIds[transition.to] }]
	}, [])
	
	return {
		doc: {
			...current,
			nets: [...current.nets.filter((net) => !pastedIds.includes(net.id)), ...remapped],
			...(doc.states ? { states: [...doc.states, ...states], transitions: [...doc.transitions, ...transitions] } : {}),
		},
		selection: [
			...instances.map(({ id }) => ({ kind: "instance", id })),
			...remapped.map(({ id }) => ({ kind: "net", id })),
			...labels.map(({ id }) => ({ kind: "label", id })),
			...backdrops.map(({ id }) => ({ kind: "backdrop", id })),
			...states.map(({ id }) => ({ kind: "state", id })),
		],
	}
}

const shiftNet = (net, delta) => shiftPoints({ instances: [], nets: [net] }, delta).nets[0]

// Moves everything selected. Wires that aren't selected stay on the pins of any
// part that moved, and selected wires travel whole.
export const moveSelection = (doc, selection, delta) => {
	const shift = ([x, y]) => [x + delta[0], y + delta[1]]
	const moved = idsOf(selection, "instance").reduce((current, id) => {
		const { at } = current.instances.find((instance) => instance.id === id)
		return updateInstance(current, id, { at: shift(at) })
	}, doc)
	const nets = idsOf(selection, "net")
	const labels = idsOf(selection, "label")
	const backdrops = idsOf(selection, "backdrop")
	const nodesOf = (id) => selection.filter((item) => item.kind === "node" && item.id === id).map((item) => item.at)
	
	const stateIds = idsOf(selection, "state")
	
	return {
		...moved,
		...(moved.states ? { states: moved.states.map((state) => {
			return stateIds.includes(state.id) ? { ...state, at: shift(state.at) } : state
		}) } : {}),
		...(moved.backdrops ? { backdrops: moved.backdrops.map((backdrop) => {
			return backdrops.includes(backdrop.id) ? { ...backdrop, at: shift(backdrop.at) } : backdrop
		}) } : {}),
		...(moved.at && idsOf(selection, "table").length > 0 ? { at: shift(moved.at) } : {}),
		nets: moved.nets.map((net) => {
			const original = doc.nets.find((candidate) => candidate.id === net.id)
			if (nets.includes(net.id)) {
				return shiftNet(original, delta)
			}
			return nodesOf(net.id).length > 0 ? moveNodes(net, nodesOf(net.id), delta) : net
		}),
		labels: moved.labels?.map((label) => labels.includes(label.id) ? { ...label, at: shift(label.at) } : label),
	}
}

export const setBusWidth = (doc, id, width) => {
	const bus = doc.nets.find((net) => net.id === id)
	const bits = bus.bits?.slice(0, width)
	const fits = (terminal) => {
		const [instance, prop] = terminal.split(".")
		const size = pinOf(doc, { instance, prop })?.width
		return size === undefined || size === width
	}
	
	return {
		...doc,
		nets: doc.nets.map((net) => {
			if (net === bus) {
				return { ...net, width, connect: net.connect.filter(fits), ...(bits ? { bits } : {}) }
			}
			if (net.taps === undefined) {
				return net
			}
			const { taps, ...rest } = net
			const kept = taps.filter((tap) => tap.bus !== id || tap.bit < width)
			return kept.length > 0 ? { ...rest, taps: kept } : rest
		}),
	}
}

export const setBitName = (doc, id, bit, name) => {
	const bus = doc.nets.find((net) => net.id === id)
	const bits = Array.from({ length: bus.width }, (_, i) => bus.bits?.[i] ?? "")
	bits[bit] = name
	return updateItem(doc, "nets", id, { bits })
}

const tapsOn = (doc, bus) => doc.nets.flatMap((net) => net.taps ?? []).filter((tap) => tap.bus === bus.id)

const firstFreeBit = (doc, bus) => {
	const used = tapsOn(doc, bus).map((tap) => tap.bit)
	const free = Array.from({ length: bus.width }, (_, i) => i).find((bit) => !used.includes(bit))
	return free ?? 0
}

const driverCount = (net) => {
	const drivers = net.connect.filter((terminal) => {
		const [, prop] = terminal.split(".")
		return prop === "output" || prop.startsWith("set")
	})
	return drivers.length + (net.inverseOf === undefined ? 0 : 1)
}

const pointOnLine = (point, line) => line.slice(1).some((next, i) => {
	const closest = closestOnSegment(point, pointOf(line[i]), pointOf(next))
	return same(closest, point)
})

const linesTouch = (a, b) => [a[0], a[a.length - 1]].some((end) => pointOnLine(pointOf(end), b))
	|| [b[0], b[b.length - 1]].some((end) => pointOnLine(pointOf(end), a))

// Groups lines into the pieces of a net that still touch each other.
const touchingGroups = (lines) => {
	const groups = lines.map((_, i) => i)
	const merge = (from, to) => groups.forEach((group, i) => {
		if (group === from) {
			groups[i] = to
		}
	})
	
	lines.forEach((a, i) => lines.forEach((b, j) => {
		if (i < j && groups[i] !== groups[j] && linesTouch(a, b)) {
			merge(groups[j], groups[i])
		}
	}))
	
	return [...new Set(groups)].map((group) => lines.filter((_, i) => groups[i] === group))
}

// Gives a net its new lines, and if they no longer touch, splits it so that what's
// left at each end really is disconnected. Anything that lost its wire lets go.
const rewireNet = (doc, net, lines) => {
	if (lines.length === 0) {
		return removeItem(doc, { kind: "net", id: net.id })
	}
	
	const { tick, connect, taps, route, points, ...fields } = net
	const groups = touchingGroups(lines)
	
	const holderOf = (point) => groups.findIndex((group) => group.some((line) => pointOnLine(point, line)))
	const groupOfTerminal = (terminal) => {
		const [owner, prop] = terminal.split(".")
		const instance = doc.instances.find((i) => i.id === owner)
		const end = instance && nearestEnd(net, pinPoint(instance, prop))
		return end === undefined ? 0 : holderOf(pointOf(net.route[end.l][end.p]))
	}
	
	let current = doc
	const pieces = groups.map((group, i) => {
		const kept = (taps ?? []).filter((tap) => holderOf(tap.at) === i)
		const keptPoints = (points ?? []).filter((point) => holderOf(point) === i)
		const piece = {
			...fields,
			id: i === 0 ? net.id : nextId(current, net.id.replace(/_\d+$/, "")),
			connect: connect.filter((terminal) => groupOfTerminal(terminal) === i),
			route: group,
			...(kept.length > 0 ? { taps: kept } : {}),
			...(keptPoints.length > 0 ? { points: keptPoints } : {}),
			...(tick !== undefined && groups.length === 1 ? { tick } : {}),
		}
		current = { ...current, nets: [...current.nets, piece] }
		return piece
	})
	
	return {
		...doc,
		nets: [...doc.nets.filter((candidate) => candidate.id !== net.id), ...pieces],
	}
}

const segmentMatches = (line, s, { from, to }) => {
	return same(pointOf(line[s]), from) && same(pointOf(line[s + 1]), to)
}

const hasSegment = (net, item) => (net.route ?? []).some((line) => {
	return line.slice(1).some((_, s) => segmentMatches(line, s, item))
})

// Matched by position, since deleting one segment can split or renumber the rest.
const removeSegment = (doc, item) => {
	const net = doc.nets.find((candidate) => hasSegment(candidate, item))
	if (net === undefined) {
		return doc
	}
	
	const lines = net.route.flatMap((line) => {
		const s = line.slice(1).findIndex((_, i) => segmentMatches(line, i, item))
		if (s === -1) {
			return [line]
		}
		return [line.slice(0, s + 1), [pointOf(line[s + 1]), ...line.slice(s + 2)]].filter((part) => part.length > 1)
	})
	
	return rewireNet(doc, net, lines)
}

// Swaps some nets for the one they became, repointing anything that named them.
const replaceNets = (doc, olds, result) => {
	const gone = olds.map((net) => net.id)
	const repointed = (id) => gone.includes(id) ? result.id : id
	
	return {
		...doc,
		nets: [...doc.nets.filter((net) => !gone.includes(net.id)), result].map((net) => ({
			...net,
			...(net.taps ? { taps: net.taps.map((tap) => ({ ...tap, bus: repointed(tap.bus) })) } : {}),
			...(net.inverseOf ? { inverseOf: repointed(net.inverseOf) } : {}),
		})),
	}
}

const joinNets = (doc, net, other) => {
	const taps = [...(net.taps ?? []), ...(other.taps ?? [])]
	const points = [...(net.points ?? []), ...(other.points ?? [])]
	const result = {
		...net,
		connect: [...new Set([...net.connect, ...other.connect])],
		route: [...net.route, ...(other.route ?? [])],
		...(taps.length > 0 ? { taps } : {}),
		...(points.length > 0 ? { points } : {}),
	}
	
	if (driverCount(result) > 1) {
		return { error: "That would give one net two outputs." }
	}
	return { doc: replaceNets(doc, [net, other], result) }
}

const servedBy = (doc, net, line, end) => net.connect.filter((terminal) => {
	const [owner, prop] = terminal.split(".")
	const instance = doc.instances.find((i) => i.id === owner)
	const nearest = instance && nearestEnd(net, pinPoint(instance, prop))
	return nearest?.l === line && nearest?.p === end
})

// Reconnects the end of a route after it's dragged: it lets go of whatever it was
// on, and connects to whatever it was dropped on.
export const dropRouteEnd = (base, doc, hit, point) => {
	const before = base.nets.find((net) => net.id === hit.id)
	const from = pointOf(before.route[hit.line][hit.vertex])
	const served = servedBy(base, before, hit.line, hit.vertex)
	
	const moved = doc.nets.find((net) => net.id === hit.id)
	const { taps, ...others } = moved
	const tapIndex = (before.taps ?? []).findIndex((tap) => same(tap.at, from))
	const oldTap = before.taps?.[tapIndex]
	const kept = (taps ?? []).filter((_, i) => i !== tapIndex)
	const net = {
		...others,
		connect: moved.connect.filter((terminal) => !served.includes(terminal)),
		...(kept.length > 0 ? { taps: kept } : {}),
	}
	const released = replaceNets(doc, [moved], net)
	
	const rest = { ...released, nets: released.nets.filter((candidate) => candidate.id !== net.id) }
	const target = drawTarget(rest, point)
	if (target === undefined) {
		return { doc: released }
	}
	
	const placed = moveVertex(released, hit, target.point)
	const current = placed.nets.find((candidate) => candidate.id === net.id)
	const refused = (error) => ({ doc: released, error })
	
	if (target.type === "pin") {
		const terminal = `${target.instance}.${target.prop}`
		const onNet = placed.nets.find((candidate) => candidate.connect.includes(terminal))
		
		if (onNet?.id === net.id) {
			return { doc: placed }
		}
		if (onNet !== undefined) {
			return isBus(onNet) === isBus(net)
				? { doc: released, ...joinNets(placed, current, onNet) }
				: refused("That pin is on a different kind of net.")
		}
		
		const refusal = pinRefusal(pinOf(placed, target), net.width)
		if (refusal !== undefined) {
			return refused(refusal)
		}
		
		const connected = { ...current, connect: [...current.connect, terminal] }
		return driverCount(connected) > 1
			? refused("That would give one net two outputs.")
			: { doc: replaceNets(placed, [current], connected) }
	}
	
	const other = placed.nets.find((candidate) => candidate.id === target.net)
	if (isBus(other) && !isBus(net)) {
		const bit = oldTap?.bus === other.id ? oldTap.bit : firstFreeBit(placed, other)
		const tap = { bus: other.id, bit, at: target.point }
		return { doc: replaceNets(placed, [current], { ...current, taps: [...(current.taps ?? []), tap] }) }
	}
	if (isBus(other) === isBus(net)) {
		return { doc: released, ...joinNets(placed, current, other) }
	}
	return refused("A bus can't join a wire. Draw the wire to the bus to tap one of its bits.")
}

// Turns a drawn route into a net, joining whatever its two ends landed on.
export const finishDrawing = (doc, points, bus, targets) => {
	const net = { id: nextId(doc, bus ? "bus" : "wire"), connect: [], route: [points] }
	
	const joined = []
	const newPins = []
	const addJoin = (id) => {
		if (!joined.includes(id)) {
			joined.push(id)
		}
	}
	
	for (const target of targets) {
		if (target?.type === "pin") {
			const terminal = `${target.instance}.${target.prop}`
			const onNet = doc.nets.find((n) => n.connect.includes(terminal))
			if (onNet !== undefined) {
				addJoin(onNet.id)
			} else if (!net.connect.includes(terminal)) {
				net.connect.push(terminal)
				newPins.push(pinOf(doc, target))
			}
		} else if (target?.type === "net") {
			const hit = doc.nets.find((n) => n.id === target.net)
			if (isBus(hit) && !bus) {
				net.taps = [...(net.taps ?? []), { bus: hit.id, bit: firstFreeBit(doc, hit), at: target.point }]
			} else if (isBus(hit) === bus) {
				addJoin(hit.id)
			} else {
				return { error: "A bus can't join a wire. Draw the wire to the bus to tap one of its bits." }
			}
		}
	}
	
	const merged = joined.map((id) => doc.nets.find((n) => n.id === id))
	if (merged.some((n) => isBus(n) !== bus)) {
		return { error: "That pin is on a different kind of net." }
	}
	
	// A new bus takes its size from the first pin that has one.
	if (bus) {
		net.width = merged[0]?.width ?? newPins.find((pin) => pin.width !== undefined)?.width ?? DEFAULT_BUS_WIDTH
	}
	const refusal = newPins.map((pin) => pinRefusal(pin, net.width)).find((message) => message !== undefined)
	if (refusal !== undefined) {
		return { error: refusal }
	}
	
	const [keep, ...absorbed] = merged
	const result = keep === undefined ? net : {
		...keep,
		connect: [...new Set([...keep.connect, ...absorbed.flatMap((n) => n.connect), ...net.connect])],
		route: [...(keep.route ?? []), ...absorbed.flatMap((n) => n.route ?? []), points],
	}
	
	const taps = [...merged.flatMap((n) => n.taps ?? []), ...(net.taps ?? [])]
	if (taps.length > 0) {
		result.taps = taps
	}
	
	const placedPoints = merged.flatMap((n) => n.points ?? [])
	if (placedPoints.length > 0) {
		result.points = placedPoints
	}
	
	if (driverCount(result) > 1 || merged.filter((n) => n.inverseOf !== undefined).length > 1) {
		return { error: "That would give one net two outputs." }
	}
	
	return {
		id: result.id,
		doc: replaceNets(doc, [keep, ...absorbed].filter(Boolean), result),
	}
}

const closestOnSegment = (p, a, b) => {
	const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
	const lengthSquared = dx * dx + dy * dy
	const t = lengthSquared === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared
	const clamped = Math.max(0, Math.min(1, t))
	return [a[0] + clamped * dx, a[1] + clamped * dy]
}

const segmentHit = (doc, point, reach) => {
	for (const net of [...doc.nets].reverse()) {
		for (const [l, line] of (net.route ?? []).entries()) {
			for (let s = 0; s < line.length - 1; s++) {
				const closest = closestOnSegment(point, pointOf(line[s]), pointOf(line[s + 1]))
				if (Math.hypot(closest[0] - point[0], closest[1] - point[1]) <= (isBus(net) ? reach + 3 : reach)) {
					return { net: net.id, line: l, segment: s, point: snapPoint(closest) }
				}
			}
		}
	}
	return undefined
}

// Places a connection point on a line. Any other net running through the same
// spot joins it, because that's what a point there means.
export const addPoint = (doc, at) => {
	const hit = segmentHit(doc, at, WIRE_SNAP)
	if (hit === undefined) {
		return { error: "Click a wire or bus to place a point." }
	}
	
	const line = doc.nets.find((net) => net.id === hit.net).route[hit.line]
	const [a, b] = [pointOf(line[hit.segment]), pointOf(line[hit.segment + 1])]
	const point = [a[0] === b[0] ? a[0] : hit.point[0], a[1] === b[1] ? a[1] : hit.point[1]]
	const onLine = (net) => net.route?.some((candidate) => pointOnLine(point, candidate))
	
	const start = doc.nets.find((net) => net.id === hit.net)
	const others = doc.nets.filter((net) => net !== start && onLine(net))
	if (others.some((net) => isBus(net) !== isBus(start))) {
		return { error: "A wire and a bus can't share a point. Draw the wire to the bus to tap it." }
	}
	
	let current = doc
	for (const other of others) {
		const joined = joinNets(current, current.nets.find((net) => net.id === hit.net), other)
		if (joined.error !== undefined) {
			return joined
		}
		current = joined.doc
	}
	
	const net = current.nets.find((candidate) => candidate.id === hit.net)
	if ((net.points ?? []).some((existing) => same(existing, point))) {
		return { doc: current, id: net.id, at: point }
	}
	
	return {
		doc: updateItem(current, "nets", net.id, { points: [...(net.points ?? []), point] }),
		id: net.id,
		at: point,
	}
}

export const pinsOf = (doc) => doc.instances.flatMap((instance) => {
	return Object.entries(pinsFor(instance)).map(([prop, pin]) => ({
		instance: instance.id, prop, at: pinPoint(instance, prop), bus: pin.bus === true,
	}))
})

// What a wire would connect to if it ended here.
export const drawTarget = (doc, point) => {
	const pin = pinsOf(doc).find(({ at }) => Math.hypot(at[0] - point[0], at[1] - point[1]) <= PIN_SNAP)
	if (pin !== undefined) {
		return { type: "pin", instance: pin.instance, prop: pin.prop, point: pin.at }
	}
	
	const hit = segmentHit(doc, point, WIRE_SNAP)
	return hit === undefined ? undefined : { type: "net", net: hit.net, point: hit.point }
}

const BOX_HANDLES = { nw: [0, 0], n: [.5, 0], ne: [1, 0], e: [1, .5], se: [1, 1], s: [.5, 1], sw: [0, 1], w: [0, .5] }

export const boxHandles = ([left, top, right, bottom]) => {
	return Object.entries(BOX_HANDLES).map(([name, [fx, fy]]) => ({
		name, at: [left + (right - left) * fx, top + (bottom - top) * fy],
	}))
}

export const frameHandles = (doc) => {
	const [x, y] = originOf(doc)
	return boxHandles([x, y, x + doc.size[0], y + doc.size[1]])
}

const resizedBox = ([x, y], [width, height], handle, delta) => {
	let [left, top, right, bottom] = [x, y, x + width, y + height]
	if (handle.includes("w")) left = Math.min(left + delta[0], right - MIN_SIZE)
	if (handle.includes("e")) right = Math.max(right + delta[0], left + MIN_SIZE)
	if (handle.includes("n")) top = Math.min(top + delta[1], bottom - MIN_SIZE)
	if (handle.includes("s")) bottom = Math.max(bottom + delta[1], top + MIN_SIZE)
	
	return { at: [left, top], size: [right - left, bottom - top] }
}

export const resizeFrame = (doc, handle, delta) => {
	const { at, size } = resizedBox(originOf(doc), doc.size, handle, delta)
	return { ...doc, origin: at, size }
}

export const resizeBackdrop = (doc, id, handle, delta) => {
	const backdrop = doc.backdrops.find((item) => item.id === id)
	return updateItem(doc, "backdrops", id, resizedBox(backdrop.at, backdrop.size, handle, delta))
}

const inBox = ([x, y], [left, top, right, bottom]) => x >= left && x <= right && y >= top && y <= bottom

export { boxOf, labelBox }

export const backdropAt = (doc, point) => {
	return [...(doc.backdrops ?? [])].reverse().find((backdrop) => inBox(point, backdropBox(backdrop)))
}

// A backdrop carries what's sitting on it, including any smaller backdrops.
export const backdropContents = (doc, id) => {
	return itemsInBox(doc, backdropBox(doc.backdrops.find((backdrop) => backdrop.id === id)))
}

const selectedBackdrop = (doc, selection) => {
	return selection.length === 1 && selection[0].kind === "backdrop"
		? doc.backdrops?.find((backdrop) => backdrop.id === selection[0].id)
		: undefined
}

const onTick = ([tickX, tickY], point) => {
	return inBox(point, [tickX - TICK_REACH, tickY - 22, tickX + 22, tickY + TICK_REACH])
}

export const onFrame = (doc, [x, y]) => {
	const [left, top] = originOf(doc)
	const [right, bottom] = [left + doc.size[0], top + doc.size[1]]
	const near = (a, b) => Math.abs(a - b) <= FRAME_SNAP
	const withinX = x >= left - FRAME_SNAP && x <= right + FRAME_SNAP
	const withinY = y >= top - FRAME_SNAP && y <= bottom + FRAME_SNAP
	
	return ((near(x, left) || near(x, right)) && withinY) || ((near(y, top) || near(y, bottom)) && withinX)
}

const pointAt = (doc, [x, y]) => {
	for (const net of doc.nets) {
		const at = (net.points ?? []).find((point) => Math.hypot(point[0] - x, point[1] - y) <= HANDLE_SNAP)
		if (at !== undefined) {
			return { id: net.id, at }
		}
	}
	return undefined
}

// What's under the pointer, topmost first.
export const hitTest = (doc, point, selection) => {
	if (selection.some((item) => item.kind === "frame")) {
		const handle = frameHandles(doc).find(({ at }) => {
			return Math.abs(at[0] - point[0]) <= HANDLE_SNAP && Math.abs(at[1] - point[1]) <= HANDLE_SNAP
		})
		if (handle !== undefined) {
			return { kind: "frame", handle: handle.name }
		}
	}
	
	const backdrop = selectedBackdrop(doc, selection)
	if (backdrop !== undefined) {
		const handle = boxHandles(backdropBox(backdrop)).find(({ at }) => {
			return Math.abs(at[0] - point[0]) <= HANDLE_SNAP && Math.abs(at[1] - point[1]) <= HANDLE_SNAP
		})
		if (handle !== undefined) {
			return { kind: "backdrop", id: backdrop.id, handle: handle.name }
		}
	}
	
	const curved = selection.length === 1 && selection[0].kind === "transition"
		&& doc.transitions.find((transition) => transition.id === selection[0].id)
	if (curved) {
		const [x, y] = transitionShape(doc, curved).handle
		if (Math.hypot(x - point[0], y - point[1]) <= HANDLE_SNAP) {
			return { kind: "curve", id: curved.id }
		}
	}
	
	const placed = pointAt(doc, point)
	if (placed !== undefined) {
		return { kind: "point", ...placed }
	}
	
	if (selection.length === 1 && ["net", "segment"].includes(selection[0].kind)) {
		const net = doc.nets.find((n) => n.id === selection[0].id)
		for (const [l, line] of (net?.route ?? []).entries()) {
			for (const [p, vertex] of line.entries()) {
				const [x, y] = pointOf(vertex)
				if (Math.hypot(x - point[0], y - point[1]) <= HANDLE_SNAP) {
					return { kind: "vertex", id: net.id, line: l, vertex: p }
				}
			}
		}
	}
	
	const state = doc.states && stateAt(doc, point)
	if (state) {
		return { kind: "state", id: state.id }
	}
	
	const bus = doc.nets.find((net) => isBus(net) && net.route?.length > 0 && onTick(busTick(net), point))
	if (bus !== undefined) {
		return { kind: "tick", id: bus.id }
	}
	
	const label = [...(doc.labels ?? [])].reverse().find((item) => inBox(point, labelBox(item)))
	if (label !== undefined) {
		return { kind: "label", id: label.id }
	}
	
	const instance = [...doc.instances].reverse().find((item) => inBox(point, boxOf(item)))
	if (instance !== undefined) {
		return { kind: "instance", id: instance.id }
	}
	
	const segment = segmentHit(doc, point, WIRE_SNAP)
	if (segment !== undefined) {
		return { kind: "net", id: segment.net, ...segment }
	}
	
	const labelled = doc.transitions && transitionLabelAt(doc, point)
	if (labelled) {
		return { kind: "transitionLabel", id: labelled.id }
	}
	
	const transition = doc.transitions && transitionAt(doc, point)
	if (transition) {
		return { kind: "transition", id: transition.id }
	}
	
	// Only a backdrop that's already selected takes a press, so a drag across the others
	// still draws a selection box.
	if (backdrop !== undefined && inBox(point, backdropBox(backdrop))) {
		return { kind: "backdrop", id: backdrop.id }
	}
	
	return onFrame(doc, point) ? { kind: "frame" } : undefined
}

const mapRoute = (net, change) => ({ ...net, route: net.route.map(change) })

// Slides a bus's width mark along the bus, to the closest spot to the pointer.
export const moveTick = (doc, id, point) => {
	const net = doc.nets.find((candidate) => candidate.id === id)
	const spots = net.route.flatMap((line) => line.slice(1).map((next, i) => {
		const [a, b] = [pointOf(line[i]), pointOf(next)]
		const [x, y] = closestOnSegment(point, a, b)
		const spot = [a[0] === b[0] ? a[0] : snap(x), a[1] === b[1] ? a[1] : snap(y)]
		return { spot, distance: Math.hypot(x - point[0], y - point[1]) }
	}))
	const { spot } = spots.reduce((best, candidate) => candidate.distance < best.distance ? candidate : best)
	return updateItem(doc, "nets", id, { tick: spot })
}

// Adds a corner to a straight run, staying exactly on the run.
export const addCorner = (doc, target) => {
	const net = doc.nets.find((candidate) => candidate.id === target.id)
	const line = net.route[target.line]
	const [a, b] = [pointOf(line[target.segment]), pointOf(line[target.segment + 1])]
	const corner = [
		a[0] === b[0] ? a[0] : target.point[0],
		a[1] === b[1] ? a[1] : target.point[1],
	]
	
	if (line[target.segment + 1].hop !== undefined || same(corner, a) || same(corner, b)) {
		return doc
	}
	
	const next = [...line.slice(0, target.segment + 1), corner, ...line.slice(target.segment + 1)]
	return updateItem(doc, "nets", net.id, mapRoute(net, (original, l) => l === target.line ? next : original))
}

export const isRouteEnd = (doc, target) => {
	const net = doc.nets.find((candidate) => candidate.id === target.id)
	return target.vertex === 0 || target.vertex === net.route[target.line].length - 1
}

// A tap at the corner being moved goes with it, so its bit name stays beside the wire.
export const moveVertex = (doc, target, xy) => {
	const net = doc.nets.find((candidate) => candidate.id === target.id)
	const from = pointOf(net.route[target.line][target.vertex])
	const moved = mapRoute(net, (line, l) => {
		return l !== target.line ? line : line.map((point, p) => p === target.vertex ? movedTo(point, xy) : point)
	})
	
	return updateItem(doc, "nets", target.id, {
		...moved,
		...(net.taps ? { taps: net.taps.map((tap) => same(tap.at, from) ? { ...tap, at: xy } : tap) } : {}),
		...(net.points ? { points: net.points.map((point) => same(point, from) ? xy : point) } : {}),
	})
}

// Drags one straight run of a net. A run at the end of a line grows a new corner,
// so the line's end stays on whatever it's connected to.
const segmentShift = (a, b, delta) => a[1] === b[1] ? [0, delta[1]] : a[0] === b[0] ? [delta[0], 0] : delta

export const segmentItem = (doc, target, delta = [0, 0]) => {
	const net = doc.nets.find((n) => n.id === target.id)
	const line = net.route[target.line]
	const [a, b] = [pointOf(line[target.segment]), pointOf(line[target.segment + 1])]
	const shift = segmentShift(a, b, delta)
	return {
		kind: "segment",
		id: net.id,
		from: [a[0] + shift[0], a[1] + shift[1]],
		to: [b[0] + shift[0], b[1] + shift[1]],
	}
}

export const moveSegment = (doc, target, delta) => {
	const net = doc.nets.find((n) => n.id === target.id)
	const line = net.route[target.line]
	const [a, b] = [pointOf(line[target.segment]), pointOf(line[target.segment + 1])]
	const shift = segmentShift(a, b, delta)
	const shifted = (point) => {
		const [x, y] = pointOf(point)
		return movedTo(point, [x + shift[0], y + shift[1]])
	}
	
	const next = [
		...line.slice(0, target.segment),
		...(target.segment === 0 ? [line[0]] : []),
		shifted(line[target.segment]),
		shifted(line[target.segment + 1]),
		...(target.segment + 2 === line.length ? [line[line.length - 1]] : []),
		...line.slice(target.segment + 2),
	]
	
	const onRun = (point) => same(closestOnSegment(point, a, b), point)
	return updateItem(doc, "nets", target.id, {
		...mapRoute(net, (original, l) => l === target.line ? next : original),
		...(net.points ? { points: net.points.map((point) => {
			return onRun(point) ? [point[0] + shift[0], point[1] + shift[1]] : point
		}) } : {}),
	})
}

const tidyLine = (line) => line.filter((point, i) => {
	return i === 0 || !same(pointOf(point), pointOf(line[i - 1]))
})

export const tidyRoutes = (doc) => ({
	...doc,
	nets: doc.nets.map((net) => {
		if (net.route === undefined) {
			return net
		}
		const route = net.route.map(tidyLine).filter((line) => line.length > 1)
		const { points, ...rest } = net
		const kept = (points ?? []).filter((point) => route.some((line) => pointOnLine(point, line)))
		return { ...rest, route, ...(kept.length > 0 ? { points: kept } : {}) }
	}),
})

const shiftPoints = (doc, [dx, dy]) => {
	const shift = ([x, y]) => [x + dx, y + dy]
	return {
		...doc,
		instances: doc.instances.map((instance) => ({ ...instance, at: shift(instance.at) })),
		labels: (doc.labels ?? []).map((label) => ({ ...label, at: shift(label.at) })),
		...(doc.backdrops ? { backdrops: doc.backdrops.map((backdrop) => ({ ...backdrop, at: shift(backdrop.at) })) } : {}),
		...(doc.states ? { states: doc.states.map((state) => ({ ...state, at: shift(state.at) })) } : {}),
		...(doc.at ? { at: shift(doc.at) } : {}),
		nets: doc.nets.map((net) => ({
			...net,
			...(net.route ? { route: net.route.map((line) => line.map((point) => movedTo(point, shift(pointOf(point))))) } : {}),
			...(net.tick ? { tick: shift(net.tick) } : {}),
			...(net.points ? { points: net.points.map(shift) } : {}),
			...(net.taps ? { taps: net.taps.map((tap) => ({ ...tap, at: shift(tap.at) })) } : {}),
		})),
	}
}

const LINE_PER_ITEM = ["instances", "nets", "labels", "backdrops", "inputs", "outputs", "connections", "constants", "rows", "states", "transitions"]

const compact = (value) => JSON.stringify(value, null, 1).replace(/\s*\n\s*/g, " ")
	.replace(/\[ /g, "[").replace(/ \]/g, "]")

// The circuit as a lesson would see it, with the box moved back to 0,0.
export const finishedCircuit = (doc) => {
	const { origin, ...rest } = doc
	const [x, y] = originOf(doc)
	const { labels, backdrops, ...shifted } = shiftPoints(rest, [-x, -y])
	return { ...shifted, ...(labels.length > 0 ? { labels } : {}), ...(backdrops?.length > 0 ? { backdrops } : {}) }
}

// Writes one entry per line, so a file's diffs stay readable.
export const formatDocument = (doc) => {
	const fields = Object.entries(doc).map(([key, value]) => {
		if (!LINE_PER_ITEM.includes(key)) {
			return `\t${JSON.stringify(key)}: ${compact(value)}`
		}
		const items = value.map((item) => `\t\t${compact(item)}`).join(",\n")
		return value.length === 0 ? `\t${JSON.stringify(key)}: []` : `\t${JSON.stringify(key)}: [\n${items}\n\t]`
	})
	
	return `{\n${fields.join(",\n")}\n}\n`
}

export const checkCircuit = (doc) => {
	if (doc.kind !== "circuit") {
		throw new Error(`The editor opens circuit files, and this is a "${doc.kind}" file.`)
	}
	
	const unknown = doc.instances.find((instance) => PARTS[instance.component] === undefined)
	if (unknown !== undefined) {
		throw new Error(`Unknown part "${unknown.component}".`)
	}
	
	return doc
}
