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

export const TruthTableCell = ({ children, lastInput }) => {
	return <td className={classNames({lastInput: lastInput === true})}>
		{children}
	</td>
}