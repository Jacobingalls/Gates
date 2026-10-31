import { PARTS } from "../Circuits/parts"
import {
	MIN_SIZE, flipInstance, flipSelection, isBus, removeSelection, rotateInstance, rotateSelection,
	setBitName, setBusWidth, updateInstance, updateItem,
} from "./circuit"

const MAX_BUS_WIDTH = 32

const Field = ({ label, children }) => {
	return <label className="editor-field">
		<span>{label}</span>
		{children}
	</label>
}

const NumberField = ({ label, value, min, max, onChange }) => {
	return <Field label={label}>
		<input
			type="number"
			min={min} max={max}
			value={value}
			onChange={(event) => {
				const number = parseInt(event.target.value, 10)
				if (!Number.isNaN(number) && number >= min && (max === undefined || number <= max)) {
					onChange(number)
				}
			}}
		/>
	</Field>
}

const ColorField = ({ value, onChange }) => {
	return <Field label="Color">
		<span className="editor-color">
			<input
				type="color"
				aria-label="Color"
				value={value ?? "#ffffff"}
				onChange={(event) => onChange(event.target.value)}
			/>
			<button type="button" disabled={value === undefined} onClick={() => onChange(undefined)}>Default</button>
		</span>
	</Field>
}

const FramePanel = ({ doc, apply }) => {
	const setSize = (index, value) => apply((current) => {
		const size = [...current.size]
		size[index] = value
		return { ...current, size }
	})
	
	return <>
		<h2>Circuit Box</h2>
		<NumberField label="Width" value={doc.size[0]} min={MIN_SIZE} onChange={(value) => setSize(0, value)} />
		<NumberField label="Height" value={doc.size[1]} min={MIN_SIZE} onChange={(value) => setSize(1, value)} />
	</>
}

const InstancePanel = ({ instance, apply }) => {
	const part = PARTS[instance.component]
	const { id } = instance
	const setProp = (prop, value) => apply((doc) => {
		const { [prop]: _, ...others } = instance.props ?? {}
		return updateInstance(doc, id, { props: value === undefined ? others : { ...others, [prop]: value } })
	})
	
	return <>
		<h2>{part.title}</h2>
		<p className="editor-id">{id}</p>
		
		<div className="editor-actions">
			<button type="button" onClick={() => apply((doc) => rotateInstance(doc, id))}>Rotate</button>
			<button type="button" onClick={() => apply((doc) => flipInstance(doc, id, "flipX"))}>Flip X</button>
			<button type="button" onClick={() => apply((doc) => flipInstance(doc, id, "flipY"))}>Flip Y</button>
		</div>
		
		{instance.component === "KeyboardButton" && <Field label="Key">
			<input
				maxLength={1}
				value={instance.props?.keyboard ?? ""}
				onChange={(event) => setProp("keyboard", event.target.value)}
			/>
		</Field>}
		{instance.component === "Counter" && <NumberField
			label="Modulo" value={instance.props?.modulo ?? 4} min={2}
			onChange={(value) => setProp("modulo", value)}
		/>}
		{instance.component === "Led" && <ColorField
			value={instance.props?.color?.startsWith("#") ? instance.props.color : undefined}
			onChange={(value) => setProp("color", value)}
		/>}
	</>
}

const LabelPanel = ({ label, apply }) => {
	const change = (patch) => apply((doc) => updateItem(doc, "labels", label.id, patch))
	
	return <>
		<h2>Text Label</h2>
		<Field label="Text">
			<input value={label.text} onChange={(event) => change({ text: event.target.value })} />
		</Field>
		<ColorField value={label.color} onChange={(color) => change({ color })} />
	</>
}

const WirePanel = ({ net, doc, apply }) => {
	const setBit = (tapIndex, bit) => apply((current) => updateItem(current, "nets", net.id, {
		taps: net.taps.map((tap, i) => i === tapIndex ? { ...tap, bit } : tap),
	}))
	
	return <>
		<h2>Wire</h2>
		<p className="editor-id">{net.id}</p>
		<ColorField
			value={net.color}
			onChange={(color) => apply((current) => updateItem(current, "nets", net.id, { color }))}
		/>
		{(net.taps ?? []).map((tap, i) => {
			const bus = doc.nets.find((n) => n.id === tap.bus)
			return <Field key={i} label={`Bit of ${tap.bus}`}>
				<select value={tap.bit} onChange={(event) => setBit(i, Number(event.target.value))}>
					{Array.from({ length: bus?.width ?? 0 }, (_, bit) => {
						return <option key={bit} value={bit}>{bus.bits?.[bit] || bit}</option>
					})}
				</select>
			</Field>
		})}
	</>
}

const BusPanel = ({ net, apply }) => {
	return <>
		<h2>Bus</h2>
		<p className="editor-id">{net.id}</p>
		<NumberField
			label="Size" value={net.width} min={2} max={MAX_BUS_WIDTH}
			onChange={(width) => apply((doc) => setBusWidth(doc, net.id, width))}
		/>
		<ColorField
			value={net.color}
			onChange={(color) => apply((doc) => updateItem(doc, "nets", net.id, { color }))}
		/>
		<h3>Bit Names</h3>
		{Array.from({ length: net.width }, (_, bit) => {
			return <Field key={bit} label={`${bit}`}>
				<input
					aria-label={`Name of bit ${bit}`}
					value={net.bits?.[bit] ?? ""}
					placeholder={`${bit}`}
					onChange={(event) => apply((doc) => setBitName(doc, net.id, bit, event.target.value))}
				/>
			</Field>
		})}
	</>
}

const ManyPanel = ({ selection, apply }) => {
	const hasParts = selection.some((item) => item.kind === "instance")
	
	return <>
		<h2>{selection.length} selected</h2>
		{hasParts && <div className="editor-actions">
			<button type="button" onClick={() => apply((doc) => rotateSelection(doc, selection))}>Rotate</button>
			<button type="button" onClick={() => apply((doc) => flipSelection(doc, selection, "flipX"))}>Flip X</button>
			<button type="button" onClick={() => apply((doc) => flipSelection(doc, selection, "flipY"))}>Flip Y</button>
		</div>}
	</>
}

export const Inspector = ({ doc, selection, apply, clearSelection, onDuplicate, locked }) => {
	const only = selection.length === 1 ? selection[0] : undefined
	const find = (items) => items?.find((item) => item.id === only?.id)
	const instance = only?.kind === "instance" ? find(doc.instances) : undefined
	const label = only?.kind === "label" ? find(doc.labels) : undefined
	const net = only?.kind === "net" || only?.kind === "segment" ? find(doc.nets) : undefined
	const many = selection.length > 1
	const frame = only?.kind === "frame"
	const point = only?.kind === "point"
	const node = only?.kind === "node"
	const deletable = many || point || node || instance !== undefined || label !== undefined || net !== undefined
	
	return <div className="editor-panel editor-inspector" inert={locked ? "" : undefined}>
		{selection.length === 0 && <p className="editor-hint">
			Click a part to edit it, or drag across the canvas to select several. Click the edge of the
			circuit box to resize it.
		</p>}
		{frame && <FramePanel doc={doc} apply={apply} />}
		{point && <h2>Connection Point</h2>}
		{node && <h2>Wire Corner</h2>}
		{many && <ManyPanel selection={selection} apply={apply} />}
		{instance && <InstancePanel instance={instance} apply={apply} />}
		{label && <LabelPanel label={label} apply={apply} />}
		{net && !isBus(net) && <WirePanel net={net} doc={doc} apply={apply} />}
		{net && isBus(net) && <BusPanel net={net} apply={apply} />}
		
		{deletable && <button
			type="button"
			className="editor-delete"
			onClick={() => {
				apply((current) => removeSelection(current, selection))
				clearSelection()
			}}
		>
			{only?.kind === "segment" ? "Delete Segment" : "Delete"}
		</button>}
		{deletable && !point && !node && <button type="button" className="editor-duplicate" onClick={onDuplicate}>
			Duplicate
		</button>}
	</div>
}
