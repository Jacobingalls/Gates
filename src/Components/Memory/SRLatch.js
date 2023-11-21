import {useState, useEffect} from "react";

import { Block, BlockLabel, InvertedBlockLabel } from "../Block"

export const SRLatch = ({x, y, s, r, setQ, setNotQ}) => {
	
	const [realQ, setRealQ] = useState(false);
	const [realNotQ, setRealNotQ] = useState(false);
	
	useEffect(() => {
		const sBool = (s === true)
		const rBool = (r === true)
		if (sBool && rBool) {
			setRealQ(false);
			setRealNotQ(false);
		} else if (sBool && !rBool) {
			setRealQ(true);
			setRealNotQ(false);
		} else if (!sBool && rBool) {
			setRealQ(false);
			setRealNotQ(true);
		} else if (!realQ && !realNotQ) {
			setRealQ(false);
			setRealNotQ(true);
		}
	}, [s, r]);
	
	useEffect(() => {
		setQ(realQ);
		setNotQ(realNotQ);
	}, [realQ, realNotQ]);
	
	return <Block title="SR Latch" x={x} y={y} width={100} height={80}>
		<BlockLabel x={10} y={25} on={s}>S</BlockLabel>
		<BlockLabel x={10} y={55} on={r}>R</BlockLabel>
		<BlockLabel x={90} y={25} align="end" on={realQ}>Q</BlockLabel>
		<InvertedBlockLabel x={90} y={55} align="end" width={-12} on={realNotQ}>Q</InvertedBlockLabel>
	</Block>
}