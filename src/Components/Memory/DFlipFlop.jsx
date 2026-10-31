import {useState, useEffect} from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

export const DFlipFlop = ({x, y, d, clk, setQ}) => {
	
	const [nextQ, setNextQ] = useState(false);
	const [currentQ, setCurrentQ] = useState(false);
	
	useEffect(() => {
		const dBool = (d === true)
		const clkBool = (clk === true)
		if (clkBool === true) {
			setNextQ(dBool)
		} else {
			setCurrentQ(nextQ)
			setQ(nextQ)
		}
	}, [d, clk, nextQ, setQ]);
	
	return <Block title="D Flip-Flop" x={x} y={y} width={100} height={80}>
		<BlockLabel x={10} y={25} on={d}>D</BlockLabel>
		<BlockLabel x={10} y={55} on={clk}>CLK</BlockLabel>
		<BlockLabel x={90} y={25} align="end" on={currentQ}>Q</BlockLabel>
		<InvertedBlockLabel x={90} y={55} align="end" width={-12} on={!currentQ}>Q</InvertedBlockLabel>
	</Block>
}