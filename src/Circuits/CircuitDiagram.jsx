import { useMemo, useState } from "react";

import { Circuit, CircuitSVG } from "./Circuit"
import { wirePath } from "./wirePath"
import { Wire } from "../Components/Wires"
import { Led } from "../Components/Outputs/Led"
import { KeyboardButton } from "../Components/Buttons/KeyboardButton.jsx"
import { AndGate } from "../Components/Gates/AndGates"
import { NotGate } from "../Components/Gates/NotGates"
import { OrGate } from "../Components/Gates/OrGates"
import { XorGate } from "../Components/Gates/XorGates"

const PARTS = { AndGate, Led, NotGate, OrGate, XorGate }

export const CircuitDiagram = ({ circuit }) => {
	const [values, setValues] = useState({});
	
	const setters = useMemo(() => Object.fromEntries(circuit.nets.map((net) => {
		return [net.id, (value) => setValues((current) => ({ ...current, [net.id]: value }))]
	})), [circuit]);
	
	const propsFor = (instance) => {
		const wired = circuit.nets.flatMap((net) => net.connect.flatMap((terminal) => {
			const [id, prop] = terminal.split(".")
			if (id !== instance.id) {
				return []
			}
			return [[prop, prop === "output" ? setters[net.id] : values[net.id] === true]]
		}))
		
		return { x: instance.at[0], y: instance.at[1], ...instance.props, ...Object.fromEntries(wired) }
	}
	
	const isButton = (instance) => instance.component === "KeyboardButton"
	
	return <Circuit width={`${circuit.size[0]}px`} height={`${circuit.size[1]}px`}>
		{circuit.instances.filter(isButton).map((instance) => {
			return <KeyboardButton key={instance.id} {...propsFor(instance)} />
		})}
		
		<CircuitSVG>
			{circuit.nets.map((net) => {
				return <Wire key={net.id} path={wirePath(net, circuit.nets)} on={values[net.id] === true} />
			})}
			{circuit.instances.filter((instance) => !isButton(instance)).map((instance) => {
				const Part = PARTS[instance.component]
				return <Part key={instance.id} {...propsFor(instance)} />
			})}
		</CircuitSVG>
	</Circuit>
}
