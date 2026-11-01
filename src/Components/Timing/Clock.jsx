import { useEffect, useState } from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

// Browsers hold timers to a few milliseconds at the shortest, so a timer only gets within
// this many of an edge, and messages to itself cover the rest.
const TIMER_LEAD = 8
// Messages an edge waits, so React can carry it through the circuit before the next one.
const SETTLE_TURNS = 6

// Starts each run on a rising edge, and rests low while it's stopped. An unconnected
// control pin leaves it running, and `still` holds it in the editor.
export const Clock = ({x, y, output, control, controlType, frequency, duty, still}) => {
	const [high, setHigh] = useState(false);
	
	const allowed = controlType === "disable" ? control !== true : control !== false
	const running = allowed && still !== true
	
	useEffect(() => {
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
		
		enter(true)
		return () => {
			clearTimeout(timer)
			port1.close()
		}
	}, [running, frequency, duty]);
	
	useEffect(() => {
		output(high)
	}, [high, output]);
	
	return <Block title="Clock" x={x} y={y} width={140} height={50}>
		{controlType === "disable"
			? <InvertedBlockLabel x={10} y={25} on={control} width={18}>EN</InvertedBlockLabel>
			: <BlockLabel x={10} y={25} on={control}>EN</BlockLabel>}
		<BlockLabel x={130} y={25} align="end" on={high}>{frequency} Hz, {duty}%</BlockLabel>
	</Block>
}
