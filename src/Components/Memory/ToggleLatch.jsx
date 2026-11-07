import { useEffect, useRef, useState } from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

// Flips on each rising edge of `clk` while `t` is high, and with nothing on `t` it flips on
// every edge. Reset wins over the clock and doesn't wait for it.
export const ToggleLatch = ({x, y, t, clk, reset, setQ, setNotQ}) => {
	
	const [currentQ, setCurrentQ] = useState(false);
	const wasHigh = useRef(false);
	
	useEffect(() => {
		const clkBool = (clk === true)
		const rising = clkBool && !wasHigh.current
		wasHigh.current = clkBool
		
		if (reset === true) {
			setCurrentQ(false)
		} else if (rising && t !== false) {
			setCurrentQ((current) => !current)
		}
	}, [t, clk, reset]);
	
	useEffect(() => {
		setQ(currentQ)
		setNotQ(!currentQ)
	}, [currentQ, setQ, setNotQ]);
	
	return <Block title="Toggle Latch" x={x} y={y} width={100} height={100}>
		<BlockLabel x={10} y={20} on={t}>T</BlockLabel>
		<BlockLabel x={10} y={50} on={clk}>CLK</BlockLabel>
		<BlockLabel x={10} y={80} on={reset}>RST</BlockLabel>
		<BlockLabel x={90} y={20} align="end" on={currentQ}>Q</BlockLabel>
		<InvertedBlockLabel x={90} y={50} align="end" width={-12} on={!currentQ}>Q</InvertedBlockLabel>
	</Block>
}
