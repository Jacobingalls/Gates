import {useState, useEffect} from "react";

import { Block, BlockLabel } from "../Block"

export const Counter = ({x, y, clk, setValue, modulo}) => {
	
	const [nextValue, setNextValue] = useState(0);
	const [currentValue, setCurrentValue] = useState(0);
	
	useEffect(() => {
		
		const clkBool = (clk === true)
		if (clkBool === true) {
			setNextValue((currentValue + 1) % modulo )
		} else {
			setCurrentValue(nextValue)
			setValue(nextValue)
		}
	}, [clk, nextValue, currentValue]);
	
	return <Block title="Counter" x={x} y={y} width={140} height={50}>
		<BlockLabel x={10} y={25} on={clk}>CLK</BlockLabel>
		<BlockLabel x={130} y={25} align="end" on={currentValue}>Value ({ currentValue })</BlockLabel>
	</Block>
}