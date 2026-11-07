import { useMemo, useState } from "react";

import { Bench, variableProps } from "./Bench"
import { shownColumns } from "./parts"
import { TruthTable, TruthTableBusRow, TruthTableRow, TruthTableHeader, TruthTableCell } from "./TruthTable"

export const TruthTableDiagram = ({ table }) => {
	const [pressed, setPressed] = useState({});
	
	const setters = useMemo(() => Object.fromEntries(table.inputs.map(({ name }) => {
		return [name, (value) => setPressed((current) => ({ ...current, [name]: value }))]
	})), [table]);
	
	const lastInput = table.inputs.length - 1
	const current = table.inputs.map(({ name }) => pressed[name] === true ? 1 : 0)
	const isLive = (row) => current.every((value, i) => row[i] === value)
	const liveRow = table.rows.find(isLive)
	
	const outputs = Object.fromEntries(table.outputs.map(({ name }, i) => {
		return [name, liveRow?.[table.inputs.length + i] ?? 0]
	}))
	
	const columns = shownColumns(table)
	
	const overlay = <TruthTable x={table.at[0]} y={table.at[1]} columns={columns}>
		<TruthTableBusRow columns={columns} lastInput={lastInput} />
		<TruthTableRow>
			{columns.map(({ name }, i) => {
				return <TruthTableHeader key={i} lastInput={i === lastInput}>{name}</TruthTableHeader>
			})}
		</TruthTableRow>
		{table.rows.map((row, r) => {
			return <TruthTableRow key={r} on={isLive(row)}>
				{row.map((value, i) => {
					return <TruthTableCell key={i} lastInput={i === lastInput}>{value}</TruthTableCell>
				})}
			</TruthTableRow>
		})}
	</TruthTable>
	
	return <Bench doc={table} propsFor={(instance) => variableProps(table, instance, setters, outputs)} overlay={overlay} />
}
