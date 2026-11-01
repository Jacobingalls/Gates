import { PARTS, bankOf, chosenBits, partName, pinLabel, pinsFor } from "../Circuits/parts"
import { defaultPinName } from "../Components/Math/Mux"
import { zoomedDisplay } from "./zoom"
import { BindingPanel, MachinePanel, StatePanel, TransitionPanel, VariablesPanel } from "./BenchPanels"
import { bindingLabel } from "./variables"
import { CommitField, DecimalField, Field, NameField, NumberField } from "./Fields"
import { LutFields } from "./LutFields"
import { SOUNDS, playSound } from "../Sounds/sounds"
import {
	MIN_SIZE, changeId, flipInstance, flipSelection, isBus, reconfigureInstance, removeSelection, rotateInstance, rotateSelection,
	setBitName, setBusWidth, updateInstance, updateItem,
} from "./circuit"

const MIN_BUS_WIDTH = 2
const MAX_BUS_WIDTH = 256
const MAX_SELECT_BITS = 4
const MIN_DUTY = 1
const MAX_DUTY = 99

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

const isBusWidth = (value) => Number.isInteger(value) && value >= MIN_BUS_WIDTH && value <= MAX_BUS_WIDTH
const isDataWidth = (value) => value === 1 || isBusWidth(value)
const isSelectBits = (value) => Number.isInteger(value) && value >= 1 && value <= MAX_SELECT_BITS

const LABEL_SIDES = [["default", "Default"], ["hidden", "Hidden"], ["top", "Top"], ["right", "Right"], ["bottom", "Bottom"], ["left", "Left"]]

const LabelSideField = ({ instance, apply }) => {
	return <Field label="Label">
		<select
			aria-label="Label side"
			value={instance.labelSide ?? "default"}
			onChange={({ target: { value } }) => apply((doc) => updateInstance(doc, instance.id, {
				labelSide: value === "default" ? undefined : value,
			}))}
		>
			{LABEL_SIDES.map(([side, title]) => <option key={side} value={side}>{title}</option>)}
		</select>
	</Field>
}

const ModeField = ({ instance, part, apply }) => {
	const setMode = (mode) => apply((doc) => {
		return reconfigureInstance(doc, instance.id, { props: { ...instance.props, mode }, bused: undefined })
	})
	
	return <Field label={part.modeLabel ?? "Input"}>
		<select
			aria-label={`${part.modeLabel ?? "Input"} mode`}
			value={instance.props?.mode ?? part.defaults.mode}
			onChange={(event) => setMode(event.target.value)}
		>
			{Object.entries(part.modes).map(([mode, { title }]) => <option key={mode} value={mode}>{title}</option>)}
		</select>
	</Field>
}

// The pins a part can gather onto a bus. Two or more make the bus, and the rest stay separate.
const BusFields = ({ instance, apply }) => {
	const chosen = chosenBits(instance)
	const { pins } = bankOf(instance)
	const names = Object.keys(pins)
	const shownName = (name) => pins[name].label?.() ?? pinLabel(name)
	const setChosen = (name, on) => apply((doc) => reconfigureInstance(doc, instance.id, {
		bused: names.filter((candidate) => candidate === name ? on : chosen.includes(candidate)),
	}))
	
	return <>
		<h3>On a Bus</h3>
		{names.map((name) => {
			return <Field key={name} label={shownName(name)}>
				<input
					type="checkbox"
					aria-label={`${shownName(name)} on a bus`}
					checked={chosen.includes(name)}
					onChange={(event) => setChosen(name, event.target.checked)}
				/>
			</Field>
		})}
		{chosen.length === 1 && <p className="editor-hint">Tick another pin to make a bus.</p>}
	</>
}

const PinNameFields = ({ instance, setProp }) => {
	const names = instance.props?.names ?? {}
	const setName = (prop, name) => {
		const { [prop]: _, ...others } = names
		const next = name === "" ? others : { ...others, [prop]: name }
		setProp("names", Object.keys(next).length === 0 ? undefined : next)
	}
	
	return <>
		<h3>Pin Names</h3>
		{Object.keys({ ...pinsFor(instance), ...bankOf(instance)?.pins }).map((prop) => {
			return <Field key={prop} label={defaultPinName(prop)}>
				<input
					aria-label={`Name of ${defaultPinName(prop)}`}
					placeholder={defaultPinName(prop)}
					value={names[prop] ?? ""}
					onChange={(event) => setName(prop, event.target.value)}
				/>
			</Field>
		})}
	</>
}

const InstancePanel = ({ doc, instance, apply, onZoom, onRenameId }) => {
	const part = PARTS[instance.component]
	const { id } = instance
	const setProp = (prop, value) => apply((doc) => {
		const { [prop]: _, ...others } = instance.props ?? {}
		return updateInstance(doc, id, { props: value === undefined ? others : { ...others, [prop]: value } })
	})
	
	return <>
		<h2>{part.title}</h2>
		<NameField
			value={instance.name}
			placeholder={partName(doc, { ...instance, name: undefined }) ?? (bindingLabel(instance) || id)}
			onChange={(name) => apply((current) => updateInstance(current, id, { name }))}
		/>
		<LabelSideField instance={instance} apply={apply} />
		<CommitField label="Id" value={id} onCommit={(to) => onRenameId(id, to)} />
		
		<div className="editor-actions">
			<button type="button" onClick={() => apply((doc) => rotateInstance(doc, id))}>Rotate</button>
			<button type="button" onClick={() => apply((doc) => flipInstance(doc, id, "flipX"))}>Flip X</button>
			<button type="button" onClick={() => apply((doc) => flipInstance(doc, id, "flipY"))}>Flip Y</button>
		</div>
		
		{part.defaults?.selectBits !== undefined && <DecimalField
			label="Select Bits" value={instance.props?.selectBits ?? part.defaults.selectBits} accepts={isSelectBits}
			onChange={(selectBits) => apply((current) => {
				return reconfigureInstance(current, id, { props: { ...instance.props, selectBits }, bused: instance.bused })
			})}
		/>}
		{part.defaults?.width !== undefined && <DecimalField
			label="Bits" value={instance.props?.width ?? part.defaults.width}
			accepts={part.defaults.selectBits === undefined ? isBusWidth : isDataWidth}
			onChange={(width) => apply((current) => {
				return reconfigureInstance(current, id, { props: { ...instance.props, width } })
			})}
		/>}
		{instance.component === "NumberDisplay" && <button type="button" onClick={() => onZoom(zoomedDisplay(instance))}>
			Zoom In
		</button>}
		{part.defaults?.selectBits !== undefined && <PinNameFields instance={instance} setProp={setProp} />}
		{part.modes !== undefined && <ModeField instance={instance} part={part} apply={apply} />}
		{bankOf(instance) !== undefined && <BusFields instance={instance} apply={apply} />}
		{doc.kind === "truthTable" && <BindingPanel doc={doc} instance={instance} apply={apply} />}
		
		{part.defaults?.keyboard !== undefined && <Field label="Key">
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
		{instance.component === "Clock" && <ClockFields instance={instance} setProp={setProp} />}
		{["SevenSegment", "NumberDisplay"].includes(instance.component) && <DisplayFields instance={instance} setProp={setProp} />}
		{instance.component === "Speaker" && <SoundField instance={instance} setProp={setProp} />}
		{instance.component === "Lut" && <LutFields instance={instance} part={part} apply={apply} />}
		{instance.component === "Led" && <ColorField
			value={instance.props?.color?.startsWith("#") ? instance.props.color : undefined}
			onChange={(value) => setProp("color", value)}
		/>}
	</>
}

const ClockFields = ({ instance, setProp }) => <>
	<DecimalField
		label="Hz" value={instance.props.frequency} accepts={(value) => value > 0}
		onChange={(value) => setProp("frequency", value)}
	/>
	<DecimalField
		label="Duty %" value={instance.props.duty} accepts={(value) => value >= MIN_DUTY && value <= MAX_DUTY}
		onChange={(value) => setProp("duty", value)}
	/>
	<Field label="Control">
		<select
			aria-label="Control type"
			value={instance.props.controlType}
			onChange={(event) => setProp("controlType", event.target.value)}
		>
			<option value="enable">Enable</option>
			<option value="disable">Disable</option>
		</select>
	</Field>
</>

const isVolume = (value) => Number.isInteger(value) && value >= 0 && value <= 100

const SoundField = ({ instance, setProp }) => {
	const { sound, volume = 100, loop = false } = instance.props
	
	return <>
		<Field label="Sound">
			<select aria-label="Sound" value={sound} onChange={(event) => setProp("sound", event.target.value)}>
				{Object.entries(SOUNDS).map(([name, { title }]) => <option key={name} value={name}>{title}</option>)}
			</select>
		</Field>
		<DecimalField label="Volume" value={volume} accepts={isVolume} onChange={(value) => setProp("volume", value)} />
		<Field label="Loop">
			<input
				type="checkbox"
				aria-label="Loop while Start is high"
				checked={loop}
				onChange={(event) => setProp("loop", event.target.checked)}
			/>
		</Field>
		<SmallField instance={instance} setProp={setProp} />
		<button type="button" onClick={() => playSound(sound, volume)}>Play</button>
	</>
}

const SmallField = ({ instance, setProp }) => <Field label="Small">
	<input
		type="checkbox"
		aria-label="Small"
		checked={instance.props?.small === true}
		onChange={(event) => setProp("small", event.target.checked ? true : undefined)}
	/>
</Field>

const DisplayFields = ({ instance, setProp }) => <>
	<SmallField instance={instance} setProp={setProp} />
	<ColorField value={instance.props?.color} onChange={(color) => setProp("color", color)} />
</>

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

const BackdropPanel = ({ backdrop, apply }) => <>
	<h2>Backdrop</h2>
	<ColorField
		value={backdrop.color}
		onChange={(color) => apply((doc) => updateItem(doc, "backdrops", backdrop.id, { color }))}
	/>
	<p className="editor-hint">Once it's selected, dragging it brings along whatever is sitting on it.</p>
</>

const NetFields = ({ net, apply, onRenameId }) => <>
	<NameField
		value={net.name}
		onChange={(name) => apply((current) => updateItem(current, "nets", net.id, { name }))}
	/>
	<CommitField label="Id" value={net.id} onCommit={(to) => onRenameId(net.id, to)} />
</>

const WirePanel = ({ net, doc, apply, onRenameId }) => {
	const setBit = (tapIndex, bit) => apply((current) => updateItem(current, "nets", net.id, {
		taps: net.taps.map((tap, i) => i === tapIndex ? { ...tap, bit } : tap),
	}))
	
	return <>
		<h2>Wire</h2>
		<NetFields net={net} apply={apply} onRenameId={onRenameId} />
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

const BusPanel = ({ net, apply, onRenameId }) => {
	return <>
		<h2>Bus</h2>
		<NetFields net={net} apply={apply} onRenameId={onRenameId} />
		<DecimalField
			label="Size" value={net.width} accepts={isBusWidth}
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

export const Inspector = ({ doc, selection, setSelection, apply, clearSelection, onDuplicate, onZoom, locked }) => {
	const renameId = (from, to) => {
		const changed = changeId(doc, from, to)
		if (changed !== doc) {
			apply(() => changed)
			setSelection((current) => current.map((item) => item.id === from ? { ...item, id: to } : item))
		}
	}
	
	const only = selection.length === 1 ? selection[0] : undefined
	const find = (items) => items?.find((item) => item.id === only?.id)
	const instance = only?.kind === "instance" ? find(doc.instances) : undefined
	const label = only?.kind === "label" ? find(doc.labels) : undefined
	const backdrop = only?.kind === "backdrop" ? find(doc.backdrops) : undefined
	const net = only?.kind === "net" || only?.kind === "segment" ? find(doc.nets) : undefined
	const many = selection.length > 1
	const frame = only?.kind === "frame"
	const point = only?.kind === "point"
	const node = only?.kind === "node"
	const state = only?.kind === "state" ? find(doc.states) : undefined
	const transition = only?.kind === "transition" ? find(doc.transitions) : undefined
	const table = only?.kind === "table"
	const deletable = many || point || node || instance !== undefined || label !== undefined || backdrop !== undefined || net !== undefined
		|| state !== undefined || transition !== undefined
	
	return <div className="editor-panel editor-inspector" inert={locked ? "" : undefined}>
		{selection.length === 0 && doc.kind === "truthTable" && <VariablesPanel doc={doc} apply={apply} />}
		{selection.length === 0 && doc.kind === "stateMachine" && <MachinePanel doc={doc} apply={apply} />}
		{selection.length === 0 && doc.kind === "circuit" && <p className="editor-hint">
			Click a part to edit it, or drag across the canvas to select several. Click the edge of the
			circuit box to resize it.
		</p>}
		{table && <VariablesPanel doc={doc} apply={apply} />}
		{state && <StatePanel doc={doc} state={state} apply={apply} />}
		{transition && <TransitionPanel doc={doc} transition={transition} apply={apply} />}
		{frame && <FramePanel doc={doc} apply={apply} />}
		{point && <h2>Connection Point</h2>}
		{node && <h2>Wire Corner</h2>}
		{many && <ManyPanel selection={selection} apply={apply} />}
		{instance && <InstancePanel doc={doc} instance={instance} apply={apply} onZoom={onZoom} onRenameId={renameId} />}
		{label && <LabelPanel label={label} apply={apply} />}
		{backdrop && <BackdropPanel backdrop={backdrop} apply={apply} />}
		{net && !isBus(net) && <WirePanel net={net} doc={doc} apply={apply} onRenameId={renameId} />}
		{net && isBus(net) && <BusPanel net={net} apply={apply} onRenameId={renameId} />}
		
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
		{deletable && !point && !node && !transition && <button type="button" className="editor-duplicate" onClick={onDuplicate}>
			Duplicate
		</button>}
	</div>
}
