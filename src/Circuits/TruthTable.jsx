import classNames from "classnames";

export const TruthTable = ({ children, x, y }) => {
	return <table style={{
	  "position": "absolute",
	  "top": `${y}px`,
	  "left": `${x}px`,
	}}>
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