import { useMemo, useState } from "react";

import { Circuit, CircuitSVG } from "./Circuit"
import { wirePath } from "./wirePath"
import { Wire, Bus, BusLabel } from "../Components/Wires"
import { Led } from "../Components/Outputs/Led"
import { TrafficLight } from "../Components/Outputs/TrafficLight"
import { KeyboardButton } from "../Components/Buttons/KeyboardButton.jsx"
import { AndGate, NandGate } from "../Components/Gates/AndGates"
import { NotGate } from "../Components/Gates/NotGates"
import { OrGate, NorGate } from "../Components/Gates/OrGates"
import { XorGate, XnorGate } from "../Components/Gates/XorGates"
import { Counter } from "../Components/Math/Counter"
import { DFlipFlop } from "../Components/Memory/DFlipFlop"
import { DLatch } from "../Components/Memory/DLatch"
import { EightBitShiftRegister } from "../Components/Memory/ShiftRegisters"
import { SRLatch } from "../Components/Memory/SRLatch"

const PARTS = {
	AndGate, Bus, BusLabel, Counter, DFlipFlop, DLatch, EightBitShiftRegister, Led, NandGate,
	NorGate, NotGate, OrGate, SRLatch, TrafficLight, XnorGate, XorGate,
}

const isOutput = (prop) => prop === "output" || prop.startsWith("set")

export const CircuitDiagram = ({ circuit }) => {
	const [values, setValues] = useState(() => {
		return Object.fromEntries(circuit.nets.map((net) => [net.id, false]))
	});
	
	const setters = useMemo(() => Object.fromEntries(circuit.nets.map((net) => {
		return [net.id, (value) => setValues((current) => {
			return current[net.id] === value ? current : { ...current, [net.id]: value }
		})]
	})), [circuit]);
	
	// A delayed net gets a new setter every render, so its gate reports again after
	// each change and the two sides of a feedback loop can settle.
	const setterFor = (net) => {
		if (net.delay === undefined) {
			return setters[net.id]
		}
		return (value) => setTimeout(() => setters[net.id](value), net.delay)
	}
	
	const read = (net) => {
		return net.inverseOf === undefined ? values[net.id] : !values[net.inverseOf]
	}
	
	const propsFor = (instance) => {
		const wired = circuit.nets.flatMap((net) => net.connect.flatMap((terminal) => {
			const [id, prop] = terminal.split(".")
			if (id !== instance.id) {
				return []
			}
			return [[prop, isOutput(prop) ? setterFor(net) : read(net)]]
		}))
		
		return { x: instance.at?.[0], y: instance.at?.[1], ...instance.props, ...Object.fromEntries(wired) }
	}
	
	const isButton = (instance) => instance.component === "KeyboardButton"
	
	return <Circuit width={`${circuit.size[0]}px`} height={`${circuit.size[1]}px`}>
		{circuit.instances.filter(isButton).map((instance) => {
			return <KeyboardButton key={instance.id} {...propsFor(instance)} />
		})}
		
		<CircuitSVG>
			{circuit.nets.filter((net) => net.route !== undefined).map((net) => {
				return <Wire key={net.id} path={wirePath(net.route)} on={read(net) === true} />
			})}
			{circuit.instances.filter((instance) => !isButton(instance)).map((instance) => {
				const Part = PARTS[instance.component]
				return <Part key={instance.id} {...propsFor(instance)} />
			})}
		</CircuitSVG>
	</Circuit>
}
