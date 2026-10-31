import {useState, useEffect} from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

export const TFlipFlop = ({x, y, clk, setQ}) => {
	
	const [nextQ, setNextQ] = useState(false);
	const [currentQ, setCurrentQ] = useState(false);
	
	useEffect(() => {
		
		// Toggles...
		const dBool = (currentQ === false)
		const clkBool = (clk === true)
		if (clkBool === true) {
			setNextQ(dBool)
		} else {
			setCurrentQ(nextQ)
			setQ(nextQ)
		}
	}, [clk, nextQ, setQ]);
	
	return <Block title="T Flip-Flop" x={x} y={y} width={100} height={80}>
		<BlockLabel x={10} y={40} on={clk}>CLK</BlockLabel>
		<BlockLabel x={90} y={25} align="end" on={currentQ}>Q</BlockLabel>
		<InvertedBlockLabel x={90} y={55} align="end" width={-12} on={!currentQ}>Q</InvertedBlockLabel>
	</Block>
}