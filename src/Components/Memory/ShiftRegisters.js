import {useState, useEffect} from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

export const EightBitShiftRegister = ({x, y, d, clk, setQ0, setQ1, setQ2, setQ3, setQ4, setQ5, setQ6, setQ7}) => {
	
	// Bits...
	const [nextState, setNextState] = useState(false);
	const [hasSetState, setHasSetState] = useState(false);
	const [currentState, setCurrentState] = useState([false, false, false, false, false, false, false, false]);
	
	useEffect(() => {
		const dBool = (d === true)
		const clkBool = (clk === true)
		if (clkBool === true) {
			setNextState(dBool)
			setHasSetState(false)
		} else if (hasSetState === false) {
			const arr = [nextState, ...(currentState.slice(0, 7))]
			setCurrentState(arr)
			
			const fps = [setQ0, setQ1, setQ2, setQ3, setQ4, setQ5, setQ6, setQ7]
			fps.forEach((fp, i) => {
				fp(arr[i])
			})
			
			setHasSetState(true)
		}
	}, [d, clk, hasSetState]);
	
	const outs = currentState.map((state, i) => {
		return <BlockLabel x={90} y={25 + (i * 30)} align="end" on={currentState[i]}>Q{i}</BlockLabel>
	})
	
	return <Block title="8-Bit Shift Register" x={x} y={y} width={100} height={260}>
		<BlockLabel x={10} y={25} on={d}>D</BlockLabel>
		<BlockLabel x={10} y={55} on={clk}>CLK</BlockLabel>
		{outs}
	</Block>
}