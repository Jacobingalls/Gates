import classNames from "classnames";

import { gridLength } from "./grid"

export const ROW_HEIGHT = 30
const MIN_COLUMN = 40
const CHARACTER_WIDTH = 8
const COLUMN_PADDING = 22

// A column is a whole number of grid steps wide, however long its name is.
export const columnWidth = ({ name }) => gridLength(Math.max(MIN_COLUMN, name.length * CHARACTER_WIDTH + COLUMN_PADDING))

// Sets every column's width, which `table-layout: fixed` then holds to.
export const TruthTableColumns = ({ columns }) => {
	return <colgroup>
		{columns.map((column, i) => <col key={i} style={{ width: columnWidth(column) }} />)}
	</colgroup>
}

export const tableWidth = (columns) => columns.reduce((sum, column) => sum + columnWidth(column), 0)

export const TruthTable = ({ children, x, y, columns }) => {
	return <table style={{
	  "position": "absolute",
	  "top": `${y}px`,
	  "left": `${x}px`,
	  "width": tableWidth(columns),
	}}>
		<TruthTableColumns columns={columns} />
		{children}
	</table>
}

export const TruthTableRow = ({ on, children }) => {
	return <tr className={classNames({on: on === true})}>
		{children}
	</tr>
}

export const TruthTableHeader = ({ children, lastInput }) => {
	return <th className={classNames({lastInput: lastInput === true})}>
		{children}
	</th>
}

// Names the buses over their columns. Tables with no buses don't get this row.
export const TruthTableBusRow = ({ columns, lastInput }) => {
	if (!columns.some(({ bus }) => bus !== undefined)) {
		return null
	}
	
	const runs = columns.reduce((all, { bus }, i) => {
		const run = all[all.length - 1]
		if (i > 0 && bus === run.bus && i !== lastInput + 1) {
			return [...all.slice(0, -1), { ...run, end: i }]
		}
		return [...all, { bus, start: i, end: i }]
	}, [])
	
	return <tr className="bus-row">
		{runs.map(({ bus, start, end }) => {
			return <th key={start} colSpan={end - start + 1} className={classNames({lastInput: end === lastInput})}>
				{bus}
			</th>
		})}
	</tr>
}

export const TruthTableCell = ({ children, lastInput }) => {
	return <td className={classNames({lastInput: lastInput === true})}>
		{children}
	</td>
}