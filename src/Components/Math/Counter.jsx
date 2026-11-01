import {useState, useEffect, useRef} from "react";

import { Block, BlockLabel } from "../Block"

export const Counter = ({x, y, clk, reset, setValue, setOverflow, modulo}) => {
	
	const [nextValue, setNextValue] = useState(0);
	const [currentValue, setCurrentValue] = useState(0);
	const [overflowing, setOverflowing] = useState(false);
	const wasHigh = useRef(false);
	
	const reportOverflow = (on) => {
		setOverflowing(on)
		setOverflow(on)
	}
	
	useEffect(() => {
		
		const clkBool = (clk === true)
		const rising = clkBool && !wasHigh.current
		wasHigh.current = clkBool
		
		// Reset wins over the clock, and a clock that was high through it doesn't count.
		if (reset === true) {
			setNextValue(0)
			setCurrentValue(0)
			setValue(0)
			reportOverflow(false)
		} else if (rising) {
			const wrapped = (currentValue + 1) % modulo
			setNextValue(wrapped)
			// High for the clock pulse that rolls over, so a second counter steps with this one.
			reportOverflow(wrapped === 0)
		} else if (!clkBool) {
			setCurrentValue(nextValue)
			setValue(nextValue)
			reportOverflow(false)
		}
	}, [clk, reset, nextValue, currentValue]);
	
	return <Block title="Counter" x={x} y={y} width={140} height={60}>
		<BlockLabel x={10} y={25} on={clk}>CLK</BlockLabel>
		<BlockLabel x={10} y={45} on={reset}>RST</BlockLabel>
		<BlockLabel x={130} y={25} align="end" on={currentValue}>Value ({ currentValue })</BlockLabel>
		<BlockLabel x={130} y={45} align="end" on={overflowing}>OVF</BlockLabel>
	</Block>
}