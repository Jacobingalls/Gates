import { useEffect } from "react";

import { Block, BlockLabel } from "../Block"

const MIN_WIDTH = 100
const SELECT_Y = 20
const FIRST_DATA_Y = 40
const DATA_SPACING = 20
const BOTTOM_ROOM = 20
const CHAR_WIDTH = 8
const SIDE_ROOM = 40
const WIDTH_STEP = 10

const NAMES = { select: "S", input: "D", output: "Y", inputs: "Inputs", setOutputs: "Outputs" }

export const defaultPinName = (prop) => NAMES[prop] ?? prop.replace("setOut", "Y").replace("in", "I")

const nameOf = (names, prop) => names?.[prop] || defaultPinName(prop)

const dataY = (way) => FIRST_DATA_Y + way * DATA_SPACING

const waysOf = (selectBits) => Array.from({ length: 2 ** selectBits }, (_, way) => way)

const selectText = (names, chosen) => `${nameOf(names, "select")} (${chosen})`

const longest = (texts) => Math.max(...texts.map((text) => text.length)) * CHAR_WIDTH

// Wide enough to keep the names on each side from running into each other.
const boxOf = (selectBits, left, right) => [
	Math.max(MIN_WIDTH, Math.ceil((longest(left) + longest(right) + SIDE_ROOM) / WIDTH_STEP) * WIDTH_STEP),
	dataY(2 ** selectBits - 1) + BOTTOM_ROOM,
]

// One bit is a plain wire, so these only become buses from two bits up.
const pinOf = (names, prop, x, y, dir, width) => [prop, {
	at: [x, y], dir, label: () => nameOf(names, prop), ...(width > 1 ? { bus: true, width } : {}),
}]

// Single-bit data pins can gather onto one bus, and wider ones are each a bus already.
const dataPins = (names, prop, x, dir, selectBits, width, stem) => {
	const pins = Object.fromEntries(waysOf(selectBits).map((way) => pinOf(names, `${stem}${way}`, x, dataY(way), dir, width)))
	return width > 1 ? { pins } : { bank: { prop, at: [x, FIRST_DATA_Y], bused: [], label: nameOf(names, prop), pins } }
}

// The select pin sits at the top and the data pins count down from a fixed spot, so
// adding ways or bits leaves what's already wired where it was.
export const muxShape = ({ selectBits, width, names }) => {
	const size = boxOf(selectBits,
		[selectText(names, 2 ** selectBits - 1), ...waysOf(selectBits).map((way) => nameOf(names, `in${way}`))],
		[nameOf(names, "output")],
	)
	const { pins, bank } = dataPins(names, "inputs", 0, "in", selectBits, width, "in")
	
	return {
		size,
		bank,
		pins: Object.fromEntries([
			pinOf(names, "select", 0, SELECT_Y, "in", selectBits),
			...Object.entries(pins ?? {}),
			pinOf(names, "output", size[0], FIRST_DATA_Y, "out", width),
		]),
	}
}

export const demuxShape = ({ selectBits, width, names }) => {
	const size = boxOf(selectBits,
		[selectText(names, 2 ** selectBits - 1), nameOf(names, "input")],
		waysOf(selectBits).map((way) => nameOf(names, `setOut${way}`)),
	)
	const { pins, bank } = dataPins(names, "setOutputs", size[0], "out", selectBits, width, "setOut")
	
	return {
		size,
		bank,
		pins: Object.fromEntries([
			pinOf(names, "select", 0, SELECT_Y, "in", selectBits),
			pinOf(names, "input", 0, FIRST_DATA_Y, "in", width),
			...Object.entries(pins ?? {}),
		]),
	}
}

const levelOf = (value, width) => width > 1 ? value || 0 : value === true

// An input with nothing on it reads 0, and so does a select with nothing on it.
export const Mux = ({x, y, select, selectBits = 1, width = 1, names, output, ...props}) => {
	const chosen = Number(select || 0)
	const value = levelOf(props[`in${chosen}`], width)
	const { size } = muxShape({ selectBits, width, names })
	
	useEffect(() => {
		output(value)
	}, [value, output]);
	
	return <Block title="Mux" x={x} y={y} width={size[0]} height={size[1]}>
		<BlockLabel x={10} y={SELECT_Y} on={chosen > 0}>{selectText(names, chosen)}</BlockLabel>
		{waysOf(selectBits).map((way) => {
			return <BlockLabel key={way} x={10} y={dataY(way)} on={way === chosen}>{nameOf(names, `in${way}`)}</BlockLabel>
		})}
		<BlockLabel x={size[0] - 10} y={FIRST_DATA_Y} align="end" on={value !== false && value !== 0}>{nameOf(names, "output")}</BlockLabel>
	</Block>
}

// The chosen output carries the input, and the others stay at 0.
export const Demux = ({x, y, input, select, selectBits = 1, width = 1, names, ...props}) => {
	const chosen = Number(select || 0)
	const value = levelOf(input, width)
	const low = levelOf(undefined, width)
	const { size } = demuxShape({ selectBits, width, names })
	
	useEffect(() => {
		waysOf(selectBits).forEach((way) => props[`setOut${way}`](way === chosen ? value : low))
	}, [chosen, value, selectBits]);
	
	return <Block title="Demux" x={x} y={y} width={size[0]} height={size[1]}>
		<BlockLabel x={10} y={SELECT_Y} on={chosen > 0}>{selectText(names, chosen)}</BlockLabel>
		<BlockLabel x={10} y={FIRST_DATA_Y} on={value !== low}>{nameOf(names, "input")}</BlockLabel>
		{waysOf(selectBits).map((way) => {
			return <BlockLabel key={way} x={size[0] - 10} y={dataY(way)} align="end" on={way === chosen && value !== low}>
				{nameOf(names, `setOut${way}`)}
			</BlockLabel>
		})}
	</Block>
}
