import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { PARTS, PartStubs, PlacedPart } from "../Circuits/parts"
import { LabelLayer, NetLayer, isButton } from "../Circuits/CircuitDiagram"
import { netPath, pointOf, wirePath } from "../Circuits/wirePath"
import { DRAG_TYPE, LABEL_ITEM } from "./Library"
import { useWindowEvent } from "./useWindowEvent"
import {
	addCorner, addInstance, addLabel, addPoint, boxOf, drawTarget, dropRouteEnd, finishDrawing, frameHandles, hitTest, itemsInBox,
	isRouteEnd, labelBox, moveSegment, moveSelection, moveTick, moveVertex, originOf, segmentItem, pinsOf, resizeFrame, snapPoint, tidyRoutes,
} from "./circuit"

const SURFACE = [4000, 3000]
const ORIGIN = [1500, 1200]
const HANDLE_SIZE = 8
const BUTTON_FACE = [40, 34]
const BUTTON_RAISE = 4
const LEAVING_REACH = 6
const NODE_REACH = 8

const noop = () => {}

const outputProps = (instance) => {
	const outputs = Object.keys(PARTS[instance.component].pins)
		.filter((prop) => prop === "output" || prop.startsWith("set"))
		.map((prop) => [prop, noop])
	
	return { x: instance.at[0], y: instance.at[1], ...Object.fromEntries(outputs), ...instance.props }
}

const sameItem = (a, b) => {
	return a.kind === b.kind && a.id === b.id && String(a.from) === String(b.from)
		&& String(a.to) === String(b.to) && String(a.at) === String(b.at)
}

const boxBetween = (a, b) => [
	Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]),
]

const SelectionBox = ({ box }) => {
	const [left, top, right, bottom] = box
	return <rect
		className="editor-selection"
		x={left - 4} y={top - 4}
		width={right - left + 8} height={bottom - top + 8}
	/>
}

// The real button is HTML, which can't sit among the canvas's layers. This stands in
// for it, raised off the grid the same way, and a rotated button only moves its pin.
const ButtonSymbol = ({ instance }) => {
	const [x, y] = instance.at
	const face = { x, width: BUTTON_FACE[0], height: BUTTON_FACE[1], rx: 5 }
	
	return <g>
		<rect className="editor-button-base" y={y + BUTTON_RAISE} {...face} />
		<rect className="editor-button-face" y={y} {...face} />
		<text
			className="editor-button-label"
			text-anchor="middle"
			dominant-baseline="central"
			x={x + BUTTON_FACE[0] / 2} y={y + BUTTON_FACE[1] / 2}
		>
			{instance.props?.keyboard}
		</text>
	</g>
}

const WireCorners = ({ net }) => net.route.flatMap((line, l) => line.map((point, p) => {
	const [x, y] = pointOf(point)
	return <circle key={`${l}-${p}`} className="editor-vertex" cx={x} cy={y} r={4} />
}))

const NetSelection = ({ net, nets, showCorners }) => {
	return <>
		<path className="editor-net-selection" d={netPath(net, nets)} />
		{showCorners && <WireCorners net={net} />}
	</>
}

// Square corners from the last drawn point out to the pointer, leaving that point
// in whichever direction the pointer first went.
const cornersTo = (from, to, leaving) => {
	if (from[0] === to[0] || from[1] === to[1]) {
		return [to]
	}
	return [leaving === "vertical" ? [from[0], to[1]] : [to[0], from[1]], to]
}

export const Canvas = ({ history, selection, setSelection, tool, setTool, setStatus, scrollKey, locked }) => {
	const { doc, apply, begin, preview } = history
	
	const scrollRef = useRef(null);
	const surfaceRef = useRef(null);
	const dragRef = useRef(null);
	const leavingRef = useRef(null);
	const scrollAtPress = useRef([0, 0]);
	const wholeWireRef = useRef(null);
	const [draft, setDraft] = useState(null);
	const [cursor, setCursor] = useState(null);
	const [marquee, setMarquee] = useState(null);
	
	useEffect(() => {
		setDraft(null)
	}, [tool]);
	
	useLayoutEffect(() => {
		const scroller = scrollRef.current
		scroller.scrollLeft = ORIGIN[0] - 60
		scroller.scrollTop = ORIGIN[1] - 60
	}, [scrollKey]);
	
	const toDiagram = (event) => {
		const { left, top } = surfaceRef.current.getBoundingClientRect()
		return [event.clientX - left - ORIGIN[0], event.clientY - top - ORIGIN[1]]
	}
	
	const finish = (points, targets) => {
		const unique = points.filter((point, i) => {
			return i === 0 || point[0] !== points[i - 1][0] || point[1] !== points[i - 1][1]
		})
		
		setDraft(null)
		if (unique.length < 2) {
			return
		}
		
		const result = finishDrawing(doc, unique, tool === "bus", targets)
		if (result.error !== undefined) {
			setStatus(result.error)
			return
		}
		
		apply(() => result.doc)
		setSelection([{ kind: "net", id: result.id }])
	}
	
	const extendDraft = (point) => {
		const target = drawTarget(doc, point)
		const at = target?.point ?? snapPoint(point)
		const leaving = cornersTo(draft.points[draft.points.length - 1], at, leavingRef.current)
		return { target, points: [...draft.points, ...leaving] }
	}
	
	const onDrawClick = (point) => {
		if (draft === null) {
			const target = drawTarget(doc, point)
			setDraft({ points: [target?.point ?? snapPoint(point)], start: target })
			return
		}
		
		const { target, points } = extendDraft(point)
		if (target !== undefined) {
			finish(points, [draft.start, target])
		} else {
			setDraft({ ...draft, points })
		}
	}
	
	useWindowEvent("keydown", (event) => {
		if (locked) {
			return
		}
		
		if (event.key === "Escape" && draft !== null) {
			setDraft(null)
		} else if (event.key === "Escape") {
			setTool("select")
		} else if (event.key === "Enter" && draft !== null) {
			// A focused button mustn't also fire.
			event.preventDefault()
			finish(draft.points, [draft.start])
		}
	});
	
	// Safari drops the first pointerdown after a native drag, and would start selecting
	// the canvas's text, so presses are mouse events. Stopping the selection also stops
	// the usual blur, so that happens here too.
	const onMouseDown = (event) => {
		event.preventDefault()
		document.activeElement?.blur()
		
		if (event.button !== 0) {
			return
		}
		
		const point = toDiagram(event)
		setCursor(point)
		scrollAtPress.current = [scrollRef.current.scrollLeft, scrollRef.current.scrollTop]
		
		if (tool === "point") {
			const placed = addPoint(doc, point)
			if (placed.error !== undefined) {
				setStatus(placed.error)
			} else {
				apply(() => placed.doc)
				setSelection([{ kind: "point", id: placed.id, at: placed.at }])
			}
			return
		}
		
		if (tool !== "select") {
			onDrawClick(point)
			return
		}
		
		const adding = event.shiftKey || event.metaKey || event.ctrlKey
		const hit = hitTest(doc, point, selection)
		const onSelectedNode = selection.some((other) => {
			return other.kind === "node" && Math.hypot(other.at[0] - point[0], other.at[1] - point[1]) <= NODE_REACH
		})
		
		if (onSelectedNode && !adding) {
			dragRef.current = { hit: { kind: "group" }, group: selection, base: doc, start: point, moved: false }
			return
		}
		
		if (hit?.kind === "point") {
			const item = { kind: "point", id: hit.id, at: hit.at }
			setSelection(adding ? [...selection.filter((other) => other.kind !== "frame"), item] : [item])
			return
		}
		
		if (hit?.kind === "tick") {
			setSelection([{ kind: "net", id: hit.id }])
			dragRef.current = { hit, base: doc, start: point, moved: false }
			return
		}
		
		const wholeWire = hit?.kind === "net" && selection.some((other) => other.kind === "net" && other.id === hit.id)
		if (event.detail === 1) {
			wholeWireRef.current = wholeWire ? hit.id : null
		}
		
		const item = hit?.kind === "net" && !wholeWire ? segmentItem(doc, hit)
			: hit && hit.id !== undefined && hit.kind !== "vertex" ? { kind: hit.kind, id: hit.id } : undefined
		const selected = item !== undefined && selection.some((other) => sameItem(other, item))
		
		if (hit === undefined) {
			if (!adding) {
				setSelection([])
			}
			dragRef.current = {
				hit: { kind: "marquee" },
				start: point,
				kept: adding ? selection : [],
				wires: !event.shiftKey,
				moved: false,
			}
			return
		}
		
		if (hit.kind === "frame" && hit.handle === undefined) {
			setSelection([{ kind: "frame" }])
			return
		}
		
		if (item !== undefined && adding) {
			const others = selection.filter((other) => other.kind !== "frame")
			setSelection(selected ? others.filter((other) => !sameItem(other, item)) : [...others, item])
			return
		}
		
		const inGroup = selected && selection.length > 1
		if (item !== undefined && !inGroup) {
			setSelection([item])
		}
		
		const movesWhole = inGroup || hit.kind === "instance" || hit.kind === "label"
		dragRef.current = {
			hit: movesWhole ? { kind: "group" } : hit,
			group: inGroup ? selection : [item],
			base: doc,
			start: point,
			moved: false,
		}
	}
	
	const onMouseMove = (event) => {
		const point = toDiagram(event)
		setCursor(point)
		
		if (draft !== null) {
			const [x, y] = draft.points[draft.points.length - 1]
			const [dx, dy] = [point[0] - x, point[1] - y]
			if (Math.hypot(dx, dy) < LEAVING_REACH) {
				leavingRef.current = null
			} else if (leavingRef.current === null) {
				leavingRef.current = Math.abs(dy) > Math.abs(dx) ? "vertical" : "horizontal"
			}
		}
		
		const drag = dragRef.current
		if (drag === null) {
			return
		}
		
		if (drag.hit.kind === "marquee") {
			drag.moved = true
			setMarquee(boxBetween(drag.start, point))
			return
		}
		
		const delta = snapPoint([point[0] - drag.start[0], point[1] - drag.start[1]])
		if (!drag.moved && delta[0] === 0 && delta[1] === 0) {
			return
		}
		if (!drag.moved) {
			drag.moved = true
			begin()
		}
		
		const { hit, base } = drag
		drag.delta = delta
		
		if (hit.kind === "group") {
			preview(() => moveSelection(base, drag.group, delta))
		} else if (hit.kind === "tick") {
			preview(() => moveTick(base, hit.id, point))
		} else if (hit.kind === "vertex") {
			preview(() => moveVertex(base, hit, snapPoint(point)))
		} else if (hit.kind === "net") {
			preview(() => moveSegment(base, hit, delta))
		} else if (hit.kind === "frame") {
			preview(() => resizeFrame(base, hit.handle, delta))
		}
	}
	
	const onMouseUp = (event) => {
		const drag = dragRef.current
		dragRef.current = null
		
		if (!drag?.moved) {
			// A click narrows a whole wire to one segment. The double click it may
			// turn out to be remembers the wire was whole.
			if (drag?.hit.kind === "net" && event.detail === 1 && wholeWireRef.current === drag.hit.id) {
				setSelection([segmentItem(doc, drag.hit)])
			}
			return
		}
		
		if (drag.hit.kind === "marquee") {
			const found = itemsInBox(doc, boxBetween(drag.start, toDiagram(event)), drag.wires)
			setMarquee(null)
			setSelection([...drag.kept, ...found.filter((item) => !drag.kept.some((other) => sameItem(other, item)))])
			return
		}
		
		if (drag.hit.kind === "vertex" && isRouteEnd(drag.base, drag.hit)) {
			const point = snapPoint(toDiagram(event))
			const dropped = dropRouteEnd(drag.base, doc, drag.hit, point)
			if (dropped.error !== undefined) {
				setStatus(dropped.error)
			}
			preview(() => dropped.doc)
			if (!dropped.doc.nets.some((net) => net.id === drag.hit.id)) {
				setSelection([])
			}
		}
		
		if (drag.hit.kind === "group") {
			const [dx, dy] = drag.delta
			setSelection((current) => current.map((item) => {
				return item.kind === "node" ? { ...item, at: [item.at[0] + dx, item.at[1] + dy] } : item
			}))
		}
		
		// A selected segment follows its drag, and a dragged corner may have changed it.
		if (drag.hit.kind === "vertex") {
			setSelection((current) => current.length === 0 ? current : [{ kind: "net", id: drag.hit.id }])
		} else if (drag.hit.kind === "net" && selection[0]?.kind === "segment") {
			setSelection([segmentItem(drag.base, drag.hit, drag.delta)])
		}
		
		preview(tidyRoutes)
	}
	
	// Drags can leave the canvas, so these listen on the window.
	useWindowEvent("mousemove", onMouseMove);
	useWindowEvent("mouseup", onMouseUp);
	
	const onDoubleClick = (event) => {
		if (draft !== null) {
			finish(draft.points, [draft.start])
			return
		}
		
		const hit = tool === "select" ? hitTest(doc, toDiagram(event), selection) : undefined
		if (hit?.kind !== "net") {
			return
		}
		
		if (wholeWireRef.current === hit.id) {
			apply((current) => addCorner(current, hit))
		}
		setSelection([{ kind: "net", id: hit.id }])
	}
	
	// A drag holds the view still, whatever the browser would like to scroll for it.
	const onScroll = (event) => {
		const drag = dragRef.current
		if (drag === null) {
			return
		}
		
		const scroller = event.currentTarget
		drag.scroll = drag.scroll ?? scrollAtPress.current
		scroller.scrollLeft = drag.scroll[0]
		scroller.scrollTop = drag.scroll[1]
	}
	
	const onDrop = (event) => {
		const name = event.dataTransfer.getData(DRAG_TYPE)
		if (name === "") {
			return
		}
		
		event.preventDefault()
		const point = toDiagram(event)
		const added = name === LABEL_ITEM ? addLabel(doc, point) : addInstance(doc, name, point)
		const kind = name === LABEL_ITEM ? "label" : "instance"
		
		apply(() => added.doc)
		setSelection([{ kind, id: added.id }])
	}
	
	const drawing = tool === "wire" || tool === "bus"
	const [frameX, frameY] = originOf(doc)
	const [width, height] = doc.size
	
	// While a box is being dragged, highlight what letting go would select.
	const inMarquee = marquee === null ? [] : itemsInBox(doc, marquee, dragRef.current?.wires)
	const shown = [...selection, ...inMarquee.filter((item) => !selection.some((other) => sameItem(other, item)))]
	const selectedIds = (kind) => shown.filter((item) => item.kind === kind).map((item) => item.id)
	const frameSelected = selection.some((item) => item.kind === "frame")
	const onlyWire = selection.length === 1 && ["net", "segment"].includes(selection[0].kind)
	const wireOfSegment = selection.length === 1 && selection[0].kind === "segment"
		&& doc.nets.find((net) => net.id === selection[0].id)
	
	const pointTarget = tool === "point" && cursor !== null ? drawTarget(doc, cursor)?.point : undefined
	
	const draftPoints = draft === null || cursor === null ? null : [
		...draft.points,
		...cornersTo(
			draft.points[draft.points.length - 1],
			drawTarget(doc, cursor)?.point ?? snapPoint(cursor),
			leavingRef.current,
		),
	]
	
	return <div className="editor-scroll" ref={scrollRef} onScroll={onScroll}>
		<div
			ref={surfaceRef}
			data-tool={tool}
			className="circuit editor-surface"
			style={{ width: SURFACE[0], height: SURFACE[1] }}
			onMouseDown={onMouseDown}
			onDragStart={(event) => event.preventDefault()}
			onDoubleClick={onDoubleClick}
			onDragOver={(event) => event.preventDefault()}
			onDrop={onDrop}
		>
			<svg width={SURFACE[0]} height={SURFACE[1]}>
				<g transform={`translate(${ORIGIN[0]},${ORIGIN[1]})`}>
					<rect className="editor-frame" x={frameX} y={frameY} width={width} height={height} />
					{frameSelected && <text className="editor-frame-size" x={frameX} y={frameY - 12}>{width} × {height}</text>}
					
					<NetLayer nets={doc.nets} isOn={() => true} />
					{doc.instances.map((instance) => {
						return <PartStubs key={instance.id} instance={instance} nets={doc.nets} />
					})}
					{doc.instances.map((instance) => {
						return isButton(instance)
							? <ButtonSymbol key={instance.id} instance={instance} />
							: <PlacedPart key={instance.id} instance={instance} partProps={outputProps(instance)} />
					})}
					<LabelLayer circuit={doc} />
					
					{frameSelected && frameHandles(doc).map(({ name, at }) => {
						return <rect
							key={name}
							data-handle={name}
							className="editor-handle"
							x={at[0] - HANDLE_SIZE / 2} y={at[1] - HANDLE_SIZE / 2}
							width={HANDLE_SIZE} height={HANDLE_SIZE}
						/>
					})}
					
					{drawing && pinsOf(doc).map(({ instance, prop, at }) => {
						return <circle key={`${instance}.${prop}`} className="editor-pin" cx={at[0]} cy={at[1]} r={4} />
					})}
					
					{doc.instances.filter((i) => selectedIds("instance").includes(i.id)).map((instance) => {
						return <SelectionBox key={instance.id} box={boxOf(instance)} />
					})}
					{doc.labels?.filter((l) => selectedIds("label").includes(l.id)).map((label) => {
						return <SelectionBox key={label.id} box={labelBox(label)} />
					})}
					{doc.nets.filter((n) => selectedIds("net").includes(n.id) && n.route).map((net) => {
						return <NetSelection key={net.id} net={net} nets={doc.nets} showCorners={onlyWire} />
					})}
					{wireOfSegment?.route && <WireCorners net={wireOfSegment} />}
					{selection.filter((item) => item.kind === "segment").map((item) => {
						return <path
							key={`${item.from}-${item.to}`}
							className="editor-segment-selection"
							d={wirePath([[item.from, item.to]])}
						/>
					})}
					{shown.filter((item) => item.kind === "node").map(({ id, at }) => {
						return <circle key={`${id}-${at}`} className="editor-vertex" cx={at[0]} cy={at[1]} r={4} />
					})}
					{selection.filter((item) => item.kind === "point").map(({ id, at }) => {
						return <circle key={`${id}-${at}`} className="editor-point-selection" cx={at[0]} cy={at[1]} r={8} />
					})}
					{tool === "point" && pointTarget && <circle
						className="editor-point-preview"
						cx={pointTarget[0]} cy={pointTarget[1]} r={4}
					/>}
					{marquee && <rect
						className="editor-marquee"
						x={marquee[0]} y={marquee[1]}
						width={marquee[2] - marquee[0]} height={marquee[3] - marquee[1]}
					/>}
					{draftPoints && <path className="editor-draft" d={wirePath([draftPoints])} />}
				</g>
			</svg>
		</div>
	</div>
}
