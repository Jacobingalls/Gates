import { chosenBits } from "../Circuits/parts"
import { DecimalField, DecimalInput, Field } from "./Fields"
import { reconfigureInstance } from "./circuit"

const MAX_ADDRESS_BITS = 8
const MAX_DATA_BITS = 32
const FORMATS = [["bits", "Bits"], ["number", "Number"]]

const wholeBetween = (low, high) => (value) => Number.isInteger(value) && value >= low && value <= high
const bitOf = (value, bit) => Math.floor(value / 2 ** bit) % 2
const topFirst = (bits) => Array.from({ length: bits }, (_, i) => bits - 1 - i)

const FormatField = ({ label, value, onChange }) => {
	return <Field label={label}>
		<select aria-label={`${label} format`} value={value} onChange={(event) => onChange(event.target.value)}>
			{FORMATS.map(([format, title]) => <option key={format} value={format}>{title}</option>)}
		</select>
	</Field>
}

const ColumnName = ({ column, fallback, columns, setName }) => {
	const value = columns?.[column] ?? ""
	
	return <th>
		<input
			aria-label={`Name of ${fallback}`}
			placeholder={fallback}
			size={Math.max(value.length, fallback.length, 2)}
			value={value}
			onChange={(event) => setName(column, event.target.value)}
		/>
	</th>
}

const LutTable = ({ props, setRow, setName }) => {
	const { addressBits, dataBits, inputFormat, outputFormat, columns } = props
	const addressColumns = inputFormat === "bits" ? topFirst(addressBits) : []
	const dataColumns = outputFormat === "bits" ? topFirst(dataBits) : []
	const top = 2 ** dataBits - 1
	
	return <div className="editor-lut">
		<table>
			<thead>
				<tr>
					{inputFormat === "bits"
						? addressColumns.map((bit) => <ColumnName key={bit} column={`A${bit}`} fallback={`A${bit}`} columns={columns} setName={setName} />)
						: <ColumnName column="address" fallback="Address" columns={columns} setName={setName} />}
					{outputFormat === "bits"
						? dataColumns.map((bit) => <ColumnName key={bit} column={`Q${bit}`} fallback={`Q${bit}`} columns={columns} setName={setName} />)
						: <ColumnName column="value" fallback="Value" columns={columns} setName={setName} />}
				</tr>
			</thead>
			<tbody>
				{Array.from({ length: 2 ** addressBits }, (_, row) => {
					const value = props.values?.[row] ?? 0
					
					return <tr key={row}>
						{inputFormat === "bits"
							? addressColumns.map((bit) => <td key={bit}>{bitOf(row, bit)}</td>)
							: <td>{row}</td>}
						{outputFormat === "bits"
							? dataColumns.map((bit) => {
								const on = bitOf(value, bit) === 1
								return <td key={bit}>
									<button
										type="button"
										className={on ? "on" : undefined}
										aria-label={`Row ${row} Q${bit}`}
										onClick={() => setRow(row, on ? value - 2 ** bit : value + 2 ** bit)}
									>
										{on ? 1 : 0}
									</button>
								</td>
							})
							: <td><DecimalInput label={`Row ${row} value`} value={value} accepts={wholeBetween(0, top)} onChange={(next) => setRow(row, next)} /></td>}
					</tr>
				})}
			</tbody>
		</table>
	</div>
}

// Rows that no longer fit the data size are cut down to it, and extra rows stay out of the file.
export const LutFields = ({ instance, part, apply }) => {
	const props = { ...part.defaults, ...instance.props }
	const { addressBits, dataBits, split } = props
	const rows = 2 ** addressBits
	const top = 2 ** dataBits - 1
	const allOnBus = chosenBits(instance).length === addressBits
	const change = ({ bused = instance.bused, ...patch }) => apply((doc) => {
		return reconfigureInstance(doc, instance.id, { props: { ...props, ...patch }, bused })
	})
	
	const resized = (rowCount, limit) => Array.from({ length: rowCount }, (_, row) => Math.min(props.values?.[row] ?? 0, limit))
	const setRow = (row, value) => change({ values: resized(rows, top).map((old, i) => i === row ? value : old) })
	const setName = (column, name) => {
		const { [column]: _, ...others } = props.columns ?? {}
		change({ columns: name === "" ? others : { ...others, [column]: name } })
	}
	
	return <>
		<DecimalField
			label="Address" value={addressBits} accepts={wholeBetween(1, MAX_ADDRESS_BITS)}
			onChange={(bits) => change({ addressBits: bits, values: resized(2 ** bits, top), bused: allOnBus ? undefined : instance.bused })}
		/>
		<DecimalField
			label="Data" value={dataBits} accepts={wholeBetween(1, MAX_DATA_BITS)}
			onChange={(bits) => change({ dataBits: bits, values: resized(rows, 2 ** bits - 1) })}
		/>
		<Field label="Split">
			<input
				type="checkbox"
				aria-label="Split output into bits"
				checked={split}
				onChange={(event) => change({ split: event.target.checked })}
			/>
		</Field>
		<h3>Contents</h3>
		<FormatField label="Input" value={props.inputFormat} onChange={(inputFormat) => change({ inputFormat })} />
		<FormatField label="Output" value={props.outputFormat} onChange={(outputFormat) => change({ outputFormat })} />
		<LutTable props={props} setRow={setRow} setName={setName} />
	</>
}
