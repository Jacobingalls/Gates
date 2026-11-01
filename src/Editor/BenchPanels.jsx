import { useEffect, useState } from "react";

import { pinLabel, pinsFor, terminalName } from "../Circuits/parts"
import { STATE_RADIUS, automaticLabel, radiusOf } from "../Circuits/stateGeometry"
import { Field } from "./Fields"
import {
	addAssertion, addConnection, addConstant, assertionTargets, conditionSources, connectionSources, connectionTargets, fitsPin, moveAssertion, removeAssertion,
	removeConnection, removeConstant, renameConstant, setAssertion, setConstantValue, setGuard, setMachineType,
	updateConnection, updateState, updateTransition,
} from "./stateMachine"
import {
	MAX_INPUTS, MAX_OUTPUTS, addVariable, addVariableBus, bindBus, bindPin, busesOn, removeVariable, renameBus,
	renameVariable, setVariableBus, sideOf,
} from "./variables"

const LIMITS = { inputs: MAX_INPUTS, outputs: MAX_OUTPUTS }

const RADIUS_RANGE = { min: 20, max: 80, step: 2 }

const NEW_BUS = "new"

const BusRow = ({ side, bus, apply }) => {
	const [name, setName] = useState(bus.name);
	useEffect(() => setName(bus.name), [bus.name]);
	
	return <Field label={bus.bits.length === 1 ? "1 bit" : `${bus.bits.length} bits`}>
		<input
			aria-label={`Bus ${bus.name} name`}
			value={name}
			onChange={(event) => setName(event.target.value)}
			onBlur={() => {
				apply((current) => renameBus(current, side, bus.name, name))
				setName(bus.name)
			}}
		/>
	</Field>
}

const VariableRow = ({ doc, side, variable, apply }) => {
	const [name, setName] = useState(variable.name);
	useEffect(() => setName(variable.name), [variable.name]);
	
	return <div className="editor-port">
		<input
			aria-label={`${side === "inputs" ? "Input" : "Output"} ${variable.name} name`}
			value={name}
			onChange={(event) => setName(event.target.value)}
			onBlur={() => {
				apply((current) => renameVariable(current, side, variable.name, name))
				setName(variable.name)
			}}
		/>
		<select
			aria-label={`${variable.name} bus`}
			title="Bus"
			value={variable.bus ?? ""}
			onChange={({ target: { value } }) => apply((current) => {
				return value === NEW_BUS
					? addVariableBus(current, side, variable.name)
					: setVariableBus(current, side, variable.name, value === "" ? undefined : value)
			})}
		>
			<option value="">No Bus</option>
			{busesOn(doc, side).map((bus) => <option key={bus.name} value={bus.name}>{bus.name}</option>)}
			<option value={NEW_BUS}>New Bus</option>
		</select>
		<button
			type="button"
			aria-label={`Remove ${variable.name}`}
			title="Remove"
			disabled={side === "inputs" && doc.inputs.length === 1}
			onClick={() => apply((current) => removeVariable(current, side, variable.name))}
		>
			×
		</button>
	</div>
}

const VariableList = ({ doc, side, title, apply }) => {
	return <>
		<h3>{title}</h3>
		{doc[side].map((variable) => {
			return <VariableRow key={variable.name} doc={doc} side={side} variable={variable} apply={apply} />
		})}
		<button
			type="button"
			disabled={doc[side].length >= LIMITS[side]}
			onClick={() => apply((current) => addVariable(current, side))}
		>
			{side === "inputs" ? "Add Input" : "Add Output"}
		</button>
		{busesOn(doc, side).map((bus) => <BusRow key={bus.name} side={side} bus={bus} apply={apply} />)}
	</>
}

export const VariablesPanel = ({ doc, apply }) => {
	return <>
		<h2>Truth Table</h2>
		<VariableList doc={doc} side="inputs" title="Inputs" apply={apply} />
		<VariableList doc={doc} side="outputs" title="Outputs" apply={apply} />
	</>
}

const BusBinding = ({ doc, instance, prop, pin, apply }) => {
	const buses = busesOn(doc, sideOf(pin)).filter(({ bits }) => bits.length === pin.width)
	
	return <Field label={`${pin.width} bits`}>
		<select
			aria-label={`${instance.id} ${prop}`}
			value={instance.bind?.[prop] ?? ""}
			onChange={(event) => {
				const { value } = event.target
				apply((current) => {
					return value === NEW_BUS
						? bindBus(current, instance.id, prop)
						: bindPin(current, instance.id, prop, value === "" ? null : value)
				})
			}}
		>
			<option value="">None</option>
			{buses.map(({ name }) => <option key={name} value={name}>{name}</option>)}
			<option value={NEW_BUS}>New Bus</option>
		</select>
	</Field>
}

export const BindingPanel = ({ doc, instance, apply }) => {
	const pins = Object.entries(pinsFor(instance))
	
	return <>
		<h3>Connected To</h3>
		{pins.map(([prop, pin]) => {
			if (pin.bus) {
				return <BusBinding key={prop} doc={doc} instance={instance} prop={prop} pin={pin} apply={apply} />
			}
			
			return <Field key={prop} label={pinLabel(prop)}>
				<select
					aria-label={`${instance.id} ${pinLabel(prop)}`}
					value={instance.bind?.[prop] ?? ""}
					onChange={(event) => {
						const name = event.target.value === "" ? null : event.target.value
						apply((current) => bindPin(current, instance.id, prop, name))
					}}
				>
					<option value="">None</option>
					{doc[sideOf(pin)].map(({ name }) => <option key={name} value={name}>{name}</option>)}
				</select>
			</Field>
		})}
	</>
}

const ConstantRow = ({ constant, apply }) => {
	const [name, setName] = useState(constant.name);
	useEffect(() => setName(constant.name), [constant.name]);
	
	return <div className="editor-port">
		<input
			aria-label={`Constant ${constant.name} name`}
			value={name}
			onChange={(event) => setName(event.target.value)}
			onBlur={() => {
				apply((current) => renameConstant(current, constant.name, name))
				setName(constant.name)
			}}
		/>
		<input
			type="number"
			min={0}
			className="editor-constant-value"
			aria-label={`Constant ${constant.name} value`}
			value={constant.value}
			onChange={(event) => {
				const value = Number(event.target.value)
				if (Number.isInteger(value) && value >= 0) {
					apply((current) => setConstantValue(current, constant.name, value))
				}
			}}
		/>
		<button
			type="button"
			aria-label={`Remove ${constant.name}`}
			title="Remove"
			onClick={() => apply((current) => removeConstant(current, constant.name))}
		>
			×
		</button>
	</div>
}

const TerminalSelect = ({ doc, label, value, terminals, onChange }) => {
	return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
		{value === "" && <option value="">Choose…</option>}
		{terminals.map((terminal) => <option key={terminal} value={terminal}>{terminalName(doc, terminal)}</option>)}
	</select>
}

const ConnectionRow = ({ doc, connection, index, apply }) => {
	const change = (patch) => apply((current) => updateConnection(current, index, patch))
	
	return <div className="editor-row">
		<TerminalSelect
			doc={doc} label={`Connection ${index + 1} from`} value={connection.from}
			terminals={connectionSources(doc)} onChange={(from) => change({ from })}
		/>
		<span className="editor-row-mark">→</span>
		<TerminalSelect
			doc={doc} label={`Connection ${index + 1} to`} value={connection.to}
			terminals={connectionTargets(doc, connection)} onChange={(to) => change({ to })}
		/>
		<button
			type="button"
			aria-label={`Remove connection ${index + 1}`}
			title="Remove"
			onClick={() => apply((current) => removeConnection(current, index))}
		>
			×
		</button>
	</div>
}

export const MachinePanel = ({ doc, apply }) => <>
	<h2>State Machine</h2>
	<Field label="Type">
		<select
			aria-label="Machine type"
			value={doc.machine}
			onChange={(event) => apply((current) => setMachineType(current, event.target.value))}
		>
			<option value="moore">Moore</option>
			<option value="mealy">Mealy</option>
		</select>
	</Field>
	<h3>Connections</h3>
	{doc.connections.map((connection, i) => {
		return <ConnectionRow key={i} doc={doc} connection={connection} index={i} apply={apply} />
	})}
	<button type="button" onClick={() => apply(addConnection)}>Add Connection</button>
	<h3>Constants</h3>
	{doc.constants.map((constant) => <ConstantRow key={constant.name} constant={constant} apply={apply} />)}
	<button type="button" onClick={() => apply(addConstant)}>Add Constant</button>
</>

const SELECT_BITS = 4

// Keeps what's typed, so the field can be cleared on the way to a new value, and goes
// back to the value on leaving if what's there doesn't fit.
const TypedBusValue = ({ doc, pin, label, value, onChange }) => {
	const [text, setText] = useState(`${value}`);
	useEffect(() => setText(`${value}`), [value]);
	
	return <input
		aria-label={label}
		list="editor-constants"
		value={text}
		onChange={(event) => {
			const typed = event.target.value
			const parsed = /^\d+$/.test(typed) ? Number(typed) : typed
			setText(typed)
			if (fitsPin(doc, parsed, pin)) {
				onChange(parsed)
			}
		}}
		onBlur={() => setText(`${value}`)}
	/>
}

// Small pins pick from a menu of what fits. Wider ones have too many values to list.
const BusValue = ({ doc, pin, label, value, onChange }) => {
	const fitting = doc.constants.filter(({ name }) => fitsPin(doc, name, pin))
	
	if (pin.width > SELECT_BITS) {
		return <TypedBusValue doc={doc} pin={pin} label={label} value={value} onChange={onChange} />
	}
	
	const numbers = Array.from({ length: 2 ** pin.width }, (_, number) => number)
	return <select
		aria-label={label}
		value={value}
		onChange={({ target }) => onChange(/^\d+$/.test(target.value) ? Number(target.value) : target.value)}
	>
		{fitting.map(({ name, value: number }) => <option key={name} value={name}>{name} ({number})</option>)}
		{numbers.map((number) => <option key={number} value={number}>{number}</option>)}
	</select>
}

const AssertionRow = ({ doc, item, list, terminal, value, apply }) => {
	const name = terminalName(doc, terminal)
	const targets = assertionTargets(doc)
	const { pin } = targets.find((target) => target.terminal === terminal)
	const free = targets.map((target) => target.terminal).filter((other) => {
		return other === terminal || item.assert[other] === undefined
	})
	const setValue = (next) => apply((current) => setAssertion(current, list, item.id, terminal, next))
	
	return <div className="editor-row">
		<TerminalSelect
			doc={doc} label={`Assert ${name}`} value={terminal} terminals={free}
			onChange={(to) => apply((current) => moveAssertion(current, list, item.id, terminal, to))}
		/>
		<span className="editor-row-mark">=</span>
		{pin.bus
			? <BusValue doc={doc} pin={pin} label={`${name} value`} value={value} onChange={setValue} />
			: <select
				aria-label={`${name} value`}
				value={value}
				onChange={(event) => setValue(Number(event.target.value))}
			>
				<option value="1">High</option>
				<option value="0">Low</option>
			</select>}
		<button
			type="button"
			aria-label={`Remove assertion on ${name}`}
			title="Remove"
			onClick={() => apply((current) => removeAssertion(current, list, item.id, terminal))}
		>
			×
		</button>
	</div>
}

const ConstantOptions = ({ doc }) => {
	return <datalist id="editor-constants">
		{doc.constants.map(({ name }) => <option key={name} value={name} />)}
	</datalist>
}

const Assertions = ({ doc, item, list, apply }) => <>
	<h3>Assertions</h3>
	{Object.entries(item.assert ?? {}).map(([terminal, value]) => {
		return <AssertionRow key={terminal} doc={doc} item={item} list={list} terminal={terminal} value={value} apply={apply} />
	})}
	<button
		type="button"
		disabled={assertionTargets(doc).every(({ terminal }) => item.assert?.[terminal] !== undefined)}
		onClick={() => apply((current) => addAssertion(current, list, item.id))}
	>
		Add Assertion
	</button>
</>

export const StatePanel = ({ doc, state, apply }) => {
	return <>
		<h2>State</h2>
		<Field label="Name">
			<input
				aria-label="State name"
				value={state.name}
				onChange={(event) => apply((current) => updateState(current, state.id, { name: event.target.value }))}
			/>
		</Field>
		<Field label="Size">
			<input
				type="range"
				aria-label="State size"
				{...RADIUS_RANGE}
				value={radiusOf(state)}
				onChange={(event) => {
					const radius = Number(event.target.value)
					apply((current) => updateState(current, state.id, { radius: radius === STATE_RADIUS ? undefined : radius }))
				}}
			/>
		</Field>
		<Field label="Summary">
			<textarea
				aria-label="State summary"
				rows={3}
				placeholder="What this state means"
				value={state.summary ?? ""}
				onChange={(event) => {
					const summary = event.target.value === "" ? undefined : event.target.value
					apply((current) => updateState(current, state.id, { summary }))
				}}
			/>
		</Field>
		<button
			type="button"
			disabled={doc.initial === state.id}
			onClick={() => apply((current) => ({ ...current, initial: state.id }))}
		>
			{doc.initial === state.id ? "Start State" : "Make Start State"}
		</button>
		{doc.machine === "moore" && <Assertions doc={doc} item={state} list="states" apply={apply} />}
		<ConstantOptions doc={doc} />
	</>
}

const OPERATORS = [["<", "<"], ["<=", "≤"], ["=", "="], ["!=", "≠"], [">=", "≥"], [">", ">"]]

const BusCondition = ({ doc, transition, terminal, pin, apply }) => {
	const label = terminalName(doc, terminal)
	const test = transition.on?.[terminal]
	const setTest = (next) => apply((current) => setGuard(current, transition.id, terminal, next))
	
	return <div className="editor-row editor-condition">
		<span className="editor-condition-name">{label}</span>
		<select
			aria-label={`Comparison on ${label}`}
			value={test?.op ?? "any"}
			onChange={({ target }) => setTest(target.value === "any" ? undefined : { op: target.value, value: test?.value ?? 0 })}
		>
			<option value="any">Any</option>
			{OPERATORS.map(([op, shown]) => <option key={op} value={op}>{shown}</option>)}
		</select>
		{test !== undefined && <TypedBusValue
			doc={doc} pin={pin} label={`Compare ${label} with`} value={test.value}
			onChange={(value) => setTest({ ...test, value })}
		/>}
	</div>
}

const WireCondition = ({ doc, transition, terminal, apply }) => {
	const label = terminalName(doc, terminal)
	
	return <Field label={label}>
		<select
			aria-label={`Condition on ${label}`}
			value={transition.on?.[terminal] ?? "any"}
			onChange={(event) => {
				const next = event.target.value === "any" ? undefined : Number(event.target.value)
				apply((current) => setGuard(current, transition.id, terminal, next))
			}}
		>
			<option value="any">Any</option>
			<option value="0">0</option>
			<option value="1">1</option>
		</select>
	</Field>
}

export const TransitionPanel = ({ doc, transition, apply }) => {
	const name = (id) => doc.states.find((state) => state.id === id)?.name
	
	return <>
		<h2>Transition</h2>
		<p className="editor-id">{name(transition.from)} → {name(transition.to)}</p>
		<Field label="Label">
			<textarea
				aria-label="Transition label"
				rows={2}
				placeholder={automaticLabel(doc, transition)}
				value={transition.label ?? ""}
				onChange={(event) => {
					const label = event.target.value === "" ? undefined : event.target.value
					apply((current) => updateTransition(current, transition.id, { label }))
				}}
			/>
		</Field>
		<button
			type="button"
			disabled={transition.curve === undefined && transition.labelOffset === undefined}
			onClick={() => apply((current) => updateTransition(current, transition.id, { curve: undefined, labelOffset: undefined }))}
		>
			Reset Line and Label Position
		</button>
		<h3>Taken When</h3>
		{conditionSources(doc).map(({ terminal, pin }) => {
			const Condition = pin.bus ? BusCondition : WireCondition
			return <Condition key={terminal} doc={doc} transition={transition} terminal={terminal} pin={pin} apply={apply} />
		})}
		{doc.machine === "mealy" && <Assertions doc={doc} item={transition} list="transitions" apply={apply} />}
		<ConstantOptions doc={doc} />
	</>
}
