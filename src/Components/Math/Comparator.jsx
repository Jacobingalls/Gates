import { useEffect } from "react";

import { Block, BlockLabel } from "../Block"

const SIZE = [120, 80]
const OUTPUT_YS = { less: 20, equal: 40, greater: 60 }
const INPUT_YS = { a: 20, b: 60 }

const output = (y, label) => ({ at: [SIZE[0], y], dir: "out", label: () => label })
const input = (y, width, label) => ({ at: [0, y], dir: "in", bus: true, width, label: () => label })

export const comparatorShape = ({ width }) => ({
	size: SIZE,
	pins: {
		a: input(INPUT_YS.a, width, "A"),
		b: input(INPUT_YS.b, width, "B"),
		setLess: output(OUTPUT_YS.less, "A < B"),
		setEqual: output(OUTPUT_YS.equal, "A = B"),
		setGreater: output(OUTPUT_YS.greater, "A > B"),
	},
})

// Exactly one output is high, and an input with nothing on it reads 0.
export const Comparator = ({x, y, a, b, setLess, setEqual, setGreater}) => {
	const [left, right] = [a || 0, b || 0]
	const less = left < right
	const greater = left > right
	const equal = !less && !greater
	
	useEffect(() => {
		setLess(less)
		setEqual(equal)
		setGreater(greater)
	}, [less, equal, greater, setLess, setEqual, setGreater]);
	
	return <Block title="Comparator" x={x} y={y} width={SIZE[0]} height={SIZE[1]}>
		<BlockLabel x={10} y={INPUT_YS.a}>A</BlockLabel>
		<BlockLabel x={10} y={INPUT_YS.b}>B</BlockLabel>
		<BlockLabel x={SIZE[0] - 10} y={OUTPUT_YS.less} align="end" on={less}>A &lt; B</BlockLabel>
		<BlockLabel x={SIZE[0] - 10} y={OUTPUT_YS.equal} align="end" on={equal}>A = B</BlockLabel>
		<BlockLabel x={SIZE[0] - 10} y={OUTPUT_YS.greater} align="end" on={greater}>A &gt; B</BlockLabel>
	</Block>
}
