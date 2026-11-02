import { useEffect } from "react";

import { Block, BlockLabel } from "../Block"

const WIDTH = 120
const MIN_HEIGHT = 50
const FIRST_PIN = 25
const PIN_SPACING = 20
const BOTTOM_ROOM = 15

const bitProp = (bit) => `setBit${bit}`
const pinY = (i) => FIRST_PIN + i * PIN_SPACING

const addressName = (bit) => `A${bit}`

// Each address bit has its own pin, top bit first, and they start out gathered on a bus.
const addressBank = (addressBits, columns) => {
	const names = Array.from({ length: addressBits }, (_, i) => addressName(addressBits - 1 - i))
	return {
		prop: "address", at: [0, FIRST_PIN], highFirst: true, bused: names, label: columns?.address ?? "Address",
		pins: Object.fromEntries(names.map((name, i) => {
			return [name, { at: [0, pinY(i)], dir: "in", offFace: true, label: () => columns?.[name] ?? name }]
		})),
	}
}

// The output is one bus, or with `split`, a wire per bit, with the top bit first.
export const lutShape = ({ addressBits, dataBits, split, bused, columns }) => {
	const bank = addressBank(addressBits, columns)
	const allBused = bused === undefined || bused.length === addressBits
	const rows = Math.max(split ? dataBits : 1, allBused ? 1 : addressBits)
	const outputs = split
		? Array.from({ length: dataBits }, (_, i) => {
			const bit = dataBits - 1 - i
			return [bitProp(bit), { at: [WIDTH, pinY(i)], dir: "out", offFace: true, label: () => columns?.[`Q${bit}`] ?? `Q${bit}` }]
		})
		: [["setValue", { at: [WIDTH, FIRST_PIN], dir: "out", bus: true, width: dataBits, label: () => columns?.value ?? "Value" }]]
	
	return {
		size: [WIDTH, Math.max(MIN_HEIGHT, pinY(rows - 1) + BOTTOM_ROOM)],
		bank,
		pins: Object.fromEntries(outputs),
	}
}

// Shows `values[address]` on its output, and rows with nothing stored read 0.
export const Lut = ({ x, y, values, addressBits, dataBits, split, bused, ...pins }) => {
	const bits = Array.from({ length: addressBits }, (_, bit) => bit)
	const row = bits.reduce((total, bit) => total + (pins[addressName(bit)] === true ? 2 ** bit : 0), 0)
	const value = values?.[row] ?? 0
	const { size } = lutShape({ addressBits, dataBits, split, bused })
	
	useEffect(() => {
		if (!split) {
			pins.setValue(value)
			return
		}
		for (let bit = 0; bit < dataBits; bit += 1) {
			pins[bitProp(bit)](Math.floor(value / 2 ** bit) % 2 === 1)
		}
	}, [value, split, dataBits]);
	
	return <Block title="LUT" x={x} y={y} width={size[0]} height={size[1]}>
		<BlockLabel x={10} y={FIRST_PIN}>A ({row})</BlockLabel>
		<BlockLabel x={WIDTH - 10} y={FIRST_PIN} align="end" on={value !== 0}>{split ? value : `Q (${value})`}</BlockLabel>
	</Block>
}
