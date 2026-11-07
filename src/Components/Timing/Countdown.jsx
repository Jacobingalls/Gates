import { useEffect, useRef, useState } from "react";

import { Block, BlockLabel } from "../Block"
import { gridLength } from "../../Circuits/grid"
import { digitCount } from "../Math/Bcd"

const MIN_WIDTH = 150
const LABEL_ROOM = 120
const DIGIT_WIDTH = 9
const HEIGHT = 80
const PIN_YS = { start: 20, clk: 40, reset: 60, value: 20, zero: 40 }

export const countdownShape = ({ width }) => {
	const blockWidth = gridLength(Math.max(MIN_WIDTH, LABEL_ROOM + digitCount(width) * DIGIT_WIDTH))
	
	return {
		size: [blockWidth, HEIGHT],
		pins: {
			start: { at: [0, PIN_YS.start], dir: "in", bus: true, width, optional: true, label: () => "Start" },
			clk: { at: [0, PIN_YS.clk], dir: "in", optional: true, label: () => "Clock" },
			reset: { at: [0, PIN_YS.reset], dir: "in", optional: true, label: () => "Reset" },
			setValue: { at: [blockWidth, PIN_YS.value], dir: "out", bus: true, width, optional: true },
			setZero: { at: [blockWidth, PIN_YS.zero], dir: "out", optional: true },
		},
	}
}

const oneLess = (value) => {
	if (typeof value !== "bigint") {
		return Math.max(value - 1, 0)
	}
	const next = value - 1n
	return next <= Number.MAX_SAFE_INTEGER ? Number(next) : next
}

// Loads `start` whenever it changes to something new, so a state setting it is enough, and
// reset loads it again and holds there while high. Each rising edge of `clk` counts down one,
// stopping at 0, where `setZero` stays high until the next load.
export const Countdown = ({x, y, start, clk, reset, setValue, setZero, width}) => {
	const [count, setCount] = useState(0);
	const wasHigh = useRef(false);
	const lastStart = useRef(0);
	const { size } = countdownShape({ width })
	
	useEffect(() => {
		const clkBool = (clk === true)
		const rising = clkBool && !wasHigh.current
		wasHigh.current = clkBool
		const changed = Boolean(start) && start !== lastStart.current
		lastStart.current = start
		
		if (reset === true || changed) {
			setCount(start || 0)
		} else if (rising) {
			setCount(oneLess)
		}
	}, [clk, reset, start]);
	
	useEffect(() => {
		setValue(count)
		setZero(count === 0)
	}, [count, setValue, setZero]);
	
	return <Block title="Countdown" x={x} y={y} width={size[0]} height={size[1]}>
		<BlockLabel x={10} y={PIN_YS.start}>START</BlockLabel>
		<BlockLabel x={10} y={PIN_YS.clk} on={clk}>CLK</BlockLabel>
		<BlockLabel x={10} y={PIN_YS.reset} on={reset}>RST</BlockLabel>
		<BlockLabel x={size[0] - 10} y={PIN_YS.value} align="end" on={count !== 0}>Value ({`${count}`})</BlockLabel>
		<BlockLabel x={size[0] - 10} y={PIN_YS.zero} align="end" on={count === 0}>ZERO</BlockLabel>
	</Block>
}
