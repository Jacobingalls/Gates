import { useEffect, useRef, useState } from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

// Browsers hold timers to a few milliseconds at the shortest, so a timer only gets within
// this many of an edge, and messages to itself cover the rest.
const TIMER_LEAD = 8
// Messages an edge waits, so React can carry it through the circuit before the next one.
const SETTLE_TURNS = 6
// How long a restart holds low, so the fall reaches whatever is listening for the next rise.
const RESTART_GAP = 30

export const ALWAYS_ON = "always"

const WIDTH = 140
const HEIGHT = 40
const CHAR_WIDTH = 7
const SIDE_ROOM = 20
const WIDTH_STEP = 10
const PIN_Y = 20
const PIN_SPACING = 20

const rateText = (frequency, duty) => `${frequency} Hz, ${duty}%`

// With no inputs there's nothing to the left of the rate, so the block is only as wide as it.
const widthFor = (text) => Math.ceil((text.length * CHAR_WIDTH + SIDE_ROOM) / WIDTH_STEP) * WIDTH_STEP

// A Clock set to always run has no control pin, and one with nothing but a restart pin has
// it in the same spot. A Clock with both takes a second row, leaving control where it was.
export const clockShape = ({ controlType, restartable, frequency, duty }) => {
	const controlled = controlType !== ALWAYS_ON
	const restartRow = controlled ? 1 : 0
	const width = controlled || restartable ? WIDTH : widthFor(rateText(frequency, duty))
	
	return {
		size: [width, HEIGHT + (restartable ? restartRow * PIN_SPACING : 0)],
		pins: {
			...(controlled ? { control: {
				at: [0, PIN_Y], dir: "in", optional: true,
				label: ({ props }) => props?.controlType === "disable" ? "Disable" : "Enable",
			} } : {}),
			...(restartable ? { restart: {
				at: [0, PIN_Y + restartRow * PIN_SPACING], dir: "in", optional: true, label: () => "Restart",
			} } : {}),
			output: { at: [width, PIN_Y], dir: "out", clock: true },
		},
	}
}

// Starts each run on a rising edge, and rests low while it's stopped. An unconnected
// control pin leaves it running, and `still` holds it in the editor. With `restartable`, a
// rising edge on `restart` starts the cycle over from a fresh rising edge, if it's running.
export const Clock = ({x, y, output, control, controlType, frequency, duty, still, restartable, restart}) => {
	const [high, setHigh] = useState(false);
	const [restarts, setRestarts] = useState(0);
	const restartWasHigh = useRef(false);
	const restartsSeen = useRef(0);
	
	const controlled = controlType !== ALWAYS_ON
	const allowed = !controlled || (controlType === "disable" ? control !== true : control !== false)
	const running = allowed && still !== true
	
	useEffect(() => {
		if (restart === true && !restartWasHigh.current) {
			setRestarts((count) => count + 1)
		}
		restartWasHigh.current = restart === true
	}, [restart]);
	
	useEffect(() => {
		const restarting = restarts !== restartsSeen.current
		restartsSeen.current = restarts
		
		if (!running) {
			setHigh(false)
			return
		}
		
		const period = 1000 / frequency
		const highTime = period * duty / 100
		let timer
		let edge = performance.now()
		const { port1, port2 } = new MessageChannel()
		
		// Each edge is timed from the last planned one, so timer delays don't add up. A
		// page that's been in the background starts again from now instead of catching up.
		const enter = (level) => {
			setHigh(level)
			edge = Math.max(edge, performance.now() - period) + (level ? highTime : period - highTime)
			
			let turns = 0
			const wait = () => {
				turns += 1
				const left = edge - performance.now()
				if (left > TIMER_LEAD) {
					timer = setTimeout(wait, left - TIMER_LEAD)
				} else if (left > 0 || turns < SETTLE_TURNS) {
					port2.postMessage(null)
				} else {
					enter(!level)
				}
			}
			port1.onmessage = wait
			wait()
		}
		
		if (restarting) {
			setHigh(false)
			timer = setTimeout(() => {
				edge = performance.now()
				enter(true)
			}, RESTART_GAP)
		} else {
			enter(true)
		}
		
		return () => {
			clearTimeout(timer)
			port1.close()
		}
	}, [running, frequency, duty, restarts]);
	
	useEffect(() => {
		output(high)
	}, [high, output]);
	
	const { size, pins } = clockShape({ controlType, restartable, frequency, duty })
	
	return <Block title="Clock" x={x} y={y} width={size[0]} height={size[1]}>
		{controlled && (controlType === "disable"
			? <InvertedBlockLabel x={10} y={PIN_Y} on={control} width={18}>EN</InvertedBlockLabel>
			: <BlockLabel x={10} y={PIN_Y} on={control}>EN</BlockLabel>)}
		{restartable && <BlockLabel x={10} y={pins.restart.at[1]} on={restart}>RST</BlockLabel>}
		{Object.keys(pins).length === 1
			? <BlockLabel x={size[0] / 2} y={PIN_Y} align="middle" on={high}>{rateText(frequency, duty)}</BlockLabel>
			: <BlockLabel x={size[0] - 10} y={PIN_Y} align="end" on={high}>{rateText(frequency, duty)}</BlockLabel>}
	</Block>
}
