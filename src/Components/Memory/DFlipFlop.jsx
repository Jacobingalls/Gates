import {useState, useEffect} from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

export const DFlipFlop = ({x, y, d, clk, setQ, setNotQ}) => {
	
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
	
	useEffect(() => {
		setNotQ?.(!currentQ);
	}, [currentQ, setNotQ]);
	
	return <Block title="D Flip-Flop" x={x} y={y} width={100} height={70}>
		<BlockLabel x={10} y={20} on={d}>D</BlockLabel>
		<BlockLabel x={10} y={50} on={clk}>CLK</BlockLabel>
		<BlockLabel x={90} y={20} align="end" on={currentQ}>Q</BlockLabel>
		<InvertedBlockLabel x={90} y={50} align="end" width={-12} on={!currentQ}>Q</InvertedBlockLabel>
	</Block>
}