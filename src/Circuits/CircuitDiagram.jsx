import { useMemo, useState } from "react";

import { Circuit, CircuitSVG } from "./Circuit"
import { PARTS, PartStubs, PlacedPart } from "./parts"
import { busTick, netPath, tapLeavesRight } from "./wirePath"
import { Wire, Bus, BusLabel, Junction } from "../Components/Wires"
import { KeyboardButton } from "../Components/Buttons/KeyboardButton.jsx"

const isOutput = (prop) => prop === "output" || prop.startsWith("set")

const isBus = (net) => net.width !== undefined

const withBit = (value, bit, on) => {
	const mask = 1 << bit
	return on ? Number(value) | mask : Number(value) & ~mask
}

export const isButton = (instance) => instance.component === "KeyboardButton"

const TapLabel = ({ net, tap, bus }) => {
	const right = tapLeavesRight(net, tap)
	const name = bus?.bits?.[tap.bit] || tap.bit
	
	return <BusLabel x={tap.at[0] + (right ? 5 : -5)} y={tap.at[1] - 5} align={right ? "start" : "end"}>
		[{name}]
	</BusLabel>
}

export const NetLayer = ({ nets, isOn }) => {
	const drawn = nets.filter((net) => net.route !== undefined && net.route.length > 0)
	
	return <>
		{drawn.filter((net) => !isBus(net)).map((net) => {
			return <Wire key={net.id} path={netPath(net, drawn)} on={isOn(net)} color={net.color} />
		})}
		{drawn.filter(isBus).map((net) => {
			const [x, y] = busTick(net)
			return <Bus key={net.id} path={netPath(net, drawn)} label={{ x, y, wires: net.width }} color={net.color} />
		})}
		{drawn.flatMap((net) => (net.points ?? []).map(([x, y]) => {
			return <Junction key={`${net.id}-${x},${y}`} x={x} y={y} on={isOn(net)} color={net.color} bus={isBus(net)} />
		}))}
	</>
}

export const LabelLayer = ({ circuit }) => {
	return <>
		{(circuit.labels ?? []).map((label) => {
			return <BusLabel key={label.id} x={label.at[0]} y={label.at[1]} color={label.color}>{label.text}</BusLabel>
		})}
		{circuit.nets.flatMap((net) => (net.taps ?? []).map((tap, i) => {
			const bus = circuit.nets.find((n) => n.id === tap.bus)
			return <TapLabel key={`${net.id}-${i}`} net={net} tap={tap} bus={bus} />
		}))}
	</>
}

export const CircuitDiagram = ({ circuit }) => {
	const [values, setValues] = useState(() => {
		return Object.fromEntries(circuit.nets.map((net) => [net.id, false]))
	});
	
	const setters = useMemo(() => Object.fromEntries(circuit.nets.map((net) => {
		const tap = net.taps?.[0]
		
		return [net.id, (value) => setValues((current) => {
			if (tap !== undefined) {
				return { ...current, [tap.bus]: withBit(current[tap.bus], tap.bit, value === true) }
			}
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
		const tap = net.taps?.[0]
		if (tap !== undefined) {
			return ((Number(values[tap.bus]) >> tap.bit) & 1) === 1
		}
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
		
		const outputs = Object.keys(PARTS[instance.component].pins)
			.filter(isOutput)
			.map((prop) => [prop, () => {}])
		
		return {
			x: instance.at[0],
			y: instance.at[1],
			...Object.fromEntries(outputs),
			...instance.props,
			...Object.fromEntries(wired),
		}
	}
	
	return <Circuit width={`${circuit.size[0]}px`} height={`${circuit.size[1]}px`}>
		{circuit.instances.filter(isButton).map((instance) => {
			return <KeyboardButton key={instance.id} {...propsFor(instance)} />
		})}
		
		<CircuitSVG>
			<NetLayer nets={circuit.nets} isOn={(net) => read(net) === true} />
			{circuit.instances.map((instance) => {
				return <PartStubs key={instance.id} instance={instance} nets={circuit.nets} />
			})}
			{circuit.instances.filter((instance) => !isButton(instance)).map((instance) => {
				return <PlacedPart key={instance.id} instance={instance} partProps={propsFor(instance)} />
			})}
			<LabelLayer circuit={circuit} />
		</CircuitSVG>
	</Circuit>
}
