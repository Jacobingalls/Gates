import { useMemo, useState } from "react";

import { Circuit, CircuitSVG } from "./Circuit"
import { GRID, snap } from "./grid"
import { PARTS, PartStubs, PlacedPart, bitOf, boxOf, extentOf, labelText, outputProps, splitBus, withBit } from "./parts"
import { busTick, netPath, tapLeavesRight } from "./wirePath"
import { Wire, Bus, BusLabel, Junction } from "../Components/Wires"

const isOutput = (prop) => prop === "output" || prop.startsWith("set")

const isBus = (net) => net.width !== undefined

export const isHtmlPart = (instance) => PARTS[instance.component].html === true

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

// Rounded boxes that lift a group of parts off the background, so they go under everything.
export const BackdropLayer = ({ backdrops }) => (backdrops ?? []).map(({ id, at, size, color }) => {
	return <rect
		key={id}
		className="backdrop"
		x={at[0]} y={at[1]} width={size[0]} height={size[1]} rx="12"
		style={color && { fill: color }}
	/>
})

// Text that goes with a part sits a grid step off its box. Beside a part it's on the grid row
// nearest the part's middle, so the tags of neighbouring parts line up. Unless the part picks a
// side, it goes beside the ones that always stay upright, and below the rest.
export const PartTag = ({ instance, className, children }) => {
	const [left, top, right, bottom] = boxOf(instance)
	const [middleX, middleY] = [(left + right) / 2, snap((top + bottom) / 2)]
	
	const places = {
		top: ["middle", middleX, top - GRID],
		bottom: ["middle", middleX, bottom + GRID],
		left: ["end", left - GRID, middleY],
		right: ["start", right + GRID, middleY],
	}
	const place = places[instance.labelSide]
		?? (isHtmlPart(instance) ? places.right : ["middle", middleX, extentOf(instance)[3] + GRID])
	
	return <text className={className} text-anchor={place[0]} dominant-baseline="central" x={place[1]} y={place[2]}>{children}</text>
}

export const LabelLayer = ({ circuit }) => {
	return <>
		{circuit.instances.map((instance) => {
			const name = labelText(circuit, instance)
			return name !== undefined && <PartTag key={instance.id} instance={instance} className="part-name">{name}</PartTag>
		})}
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
			const next = typeof value === "function" ? value(current[net.id]) : value
			return current[net.id] === next ? current : { ...current, [net.id]: next }
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
			return bitOf(values[tap.bus], tap.bit)
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
		
		const outputs = outputProps(instance).map((prop) => [prop, () => {}])
		
		return splitBus(instance, {
			x: instance.at[0],
			y: instance.at[1],
			...Object.fromEntries(outputs),
			...instance.props,
			...Object.fromEntries(wired),
		})
	}
	
	return <Circuit width={`${circuit.size[0]}px`} height={`${circuit.size[1]}px`}>
		{circuit.instances.filter(isHtmlPart).map((instance) => {
			const { Component } = PARTS[instance.component]
			return <Component key={instance.id} {...propsFor(instance)} />
		})}
		
		<CircuitSVG>
			<BackdropLayer backdrops={circuit.backdrops} />
			<NetLayer nets={circuit.nets} isOn={(net) => read(net) === true} />
			{circuit.instances.map((instance) => {
				return <PartStubs key={instance.id} instance={instance} nets={circuit.nets} />
			})}
			{circuit.instances.filter((instance) => !isHtmlPart(instance)).map((instance) => {
				return <PlacedPart key={instance.id} instance={instance} partProps={propsFor(instance)} />
			})}
			<LabelLayer circuit={circuit} />
		</CircuitSVG>
	</Circuit>
}
