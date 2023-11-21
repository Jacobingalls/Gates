import {useState, useEffect} from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

export const DLatch = ({x, y, d, en, setQ}) => {
	
	const [realQ, setRealQ] = useState(false);
	
	useEffect(() => {
		const dBool = (d === true)
		const enBool = (en === true)
		if (enBool) {
			setRealQ(dBool)
		}
	}, [d, en]);
	
	useEffect(() => {
		setQ(realQ);
	}, [realQ]);
	
	return <Block title="D Latch" x={x} y={y} width={100} height={80}>
		<BlockLabel x={10} y={25} on={d}>D</BlockLabel>
		<BlockLabel x={10} y={55} on={en}>En</BlockLabel>
		<BlockLabel x={90} y={25} align="end" on={realQ}>Q</BlockLabel>
		<InvertedBlockLabel x={90} y={55} align="end" width={-12} on={!realQ}>Q</InvertedBlockLabel>
	</Block>
}