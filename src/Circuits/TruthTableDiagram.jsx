import { useMemo, useState } from "react";

import { Circuit, CircuitSVG } from "./Circuit"
import { TruthTable, TruthTableRow, TruthTableHeader, TruthTableCell } from "./TruthTable"
import { Led } from "../Components/Outputs/Led"
import { KeyboardButton } from "../Components/Buttons/KeyboardButton.jsx"

export const TruthTableDiagram = ({ table }) => {
	const [pressed, setPressed] = useState({});
	
	const setters = useMemo(() => table.inputs.map((_, i) => {
		return (value) => setPressed((current) => ({ ...current, [i]: value }))
	}), [table]);
	
	const lastInput = table.inputs.length - 1
	const current = table.inputs.map((_, i) => pressed[i] === true ? 1 : 0)
	const isLive = (row) => current.every((value, i) => row[i] === value)
	const liveRow = table.rows.find(isLive)
	
	return <Circuit width={`${table.size[0]}px`} height={`${table.size[1]}px`}>
		{table.inputs.map((input, i) => {
			return <KeyboardButton
				key={input.title}
				x={input.at[0]} y={input.at[1]}
				output={setters[i]}
				keyboard={input.keyboard}
			/>
		})}
		
		<TruthTable x={table.at[0]} y={table.at[1]}>
			<TruthTableRow>
				{[...table.inputs, ...table.outputs].map(({ title }, i) => {
					return <TruthTableHeader key={title} lastInput={i === lastInput}>{title}</TruthTableHeader>
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
		
		<CircuitSVG>
			{table.outputs.map((output, i) => {
				return <Led
					key={output.title}
					x={output.at[0]} y={output.at[1]}
					on={liveRow[table.inputs.length + i] === 1}
				/>
			})}
		</CircuitSVG>
	</Circuit>
}
