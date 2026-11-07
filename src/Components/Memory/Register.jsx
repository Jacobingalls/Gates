import { useEffect, useRef, useState } from "react";

import { Block, BlockLabel } from "../Block"
import { gridLength } from "../../Circuits/grid"
import { digitCount } from "../Math/Bcd"

const MIN_WIDTH = 120
const LABEL_ROOM = 90
const DIGIT_WIDTH = 9
const HEIGHT = 80
const PIN_YS = { d: 20, clk: 40, reset: 60 }

export const registerShape = ({ width }) => {
	const blockWidth = gridLength(Math.max(MIN_WIDTH, LABEL_ROOM + digitCount(width) * DIGIT_WIDTH))
	
	return {
		size: [blockWidth, HEIGHT],
		pins: {
			d: { at: [0, PIN_YS.d], dir: "in", bus: true, width },
			clk: { at: [0, PIN_YS.clk], dir: "in" },
			reset: { at: [0, PIN_YS.reset], dir: "in" },
			setValue: { at: [blockWidth, PIN_YS.d], dir: "out", bus: true, width },
		},
	}
}

// Stores `d` on each rising edge of `clk`, and holds it until the next one. Reset wins over
// the clock and doesn't wait for it, and a clock that was high through it doesn't store.
export const Register = ({x, y, d, clk, reset, setValue, width}) => {
	const [held, setHeld] = useState(0);
	const wasHigh = useRef(false);
	const { size } = registerShape({ width })
	
	useEffect(() => {
		const clkBool = (clk === true)
		const rising = clkBool && !wasHigh.current
		wasHigh.current = clkBool
		
		if (reset === true) {
			setHeld(0)
		} else if (rising) {
			setHeld(d || 0)
		}
	}, [clk, reset, d]);
	
	useEffect(() => {
		setValue(held)
	}, [held, setValue]);
	
	return <Block title="Register" x={x} y={y} width={size[0]} height={size[1]}>
		<BlockLabel x={10} y={PIN_YS.d}>D</BlockLabel>
		<BlockLabel x={10} y={PIN_YS.clk} on={clk}>CLK</BlockLabel>
		<BlockLabel x={10} y={PIN_YS.reset} on={reset}>RST</BlockLabel>
		<BlockLabel x={size[0] - 10} y={PIN_YS.d} align="end" on={held !== 0}>Q ({`${held}`})</BlockLabel>
	</Block>
}
