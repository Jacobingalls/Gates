import { shownColumns } from "../Circuits/parts"
import { combinations } from "./combinations"

const ROW_HEIGHT = 29
const MIN_COLUMN = 45
const CHARACTER_WIDTH = 8
const COLUMN_PADDING = 22

// One row per input combination in counting order, keeping any outputs that apply.
export const fullRows = (table, source = table) => {
	const shared = Math.min(table.inputs.length, source.inputs.length)
	
	return combinations(table.inputs.map(() => 2)).map((values) => {
		const kept = source.rows.find((row) => row.slice(0, shared).every((value, i) => value === values[i]))
		return [...values, ...table.outputs.map((_, i) => kept?.[source.inputs.length + i] ?? 0)]
	})
}

export const blankTable = () => {
	const table = {
		format: 1,
		kind: "truthTable",
		size: [350, 150],
		at: [85, 3],
		inputs: [{ name: "a" }, { name: "b" }],
		outputs: [{ name: "y" }],
		instances: [
			{ id: "button_1", component: "KeyboardButton", at: [10, 30], props: { keyboard: "1" }, bind: { output: "a" } },
			{ id: "button_2", component: "KeyboardButton", at: [10, 80], props: { keyboard: "2" }, bind: { output: "b" } },
			{ id: "light_1", component: "Led", at: [290, 75], bind: { on: "y" } },
		],
		nets: [],
		rows: [],
	}
	return { ...table, rows: fullRows(table) }
}

export const toggleCell = (table, row, column) => ({
	...table,
	rows: table.rows.map((values, r) => {
		return r !== row ? values : values.map((value, c) => c === column ? 1 - value : value)
	}),
})

export const tableBox = (table) => {
	const width = shownColumns(table).reduce((sum, { name }) => {
		return sum + Math.max(MIN_COLUMN, name.length * CHARACTER_WIDTH + COLUMN_PADDING)
	}, 0)
	const headers = [...table.inputs, ...table.outputs].some(({ bus }) => bus !== undefined) ? 2 : 1
	const [x, y] = table.at
	return [x, y, x + width, y + (table.rows.length + headers) * ROW_HEIGHT]
}

export const checkTable = (table) => {
	if (table.instances === undefined || table.inputs.some((input) => input.name === undefined)) {
		throw new Error("This truth table uses an older format.")
	}
	return table.rows.length === 2 ** table.inputs.length ? table : { ...table, rows: fullRows(table) }
}
