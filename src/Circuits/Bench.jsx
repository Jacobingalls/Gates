import { Circuit, CircuitSVG } from "./Circuit"
import { BackdropLayer, LabelLayer, isHtmlPart } from "./CircuitDiagram"
import { PARTS, PlacedPart, busedPins, pinsFor } from "./parts"

const noop = () => {}

// An unconnected pin has no bus, which mustn't match the variables that aren't on one.
export const busBits = (variables, bus) => {
	return variables.filter((variable) => bus !== undefined && variable.bus === bus).map(({ name }) => name)
}

// Turns a part's pins into props: buttons and switches set their input variable,
// and displays read their output variables. A bus pin takes its bus's variables in order.
export const variableProps = (doc, instance, setters, outputs) => {
	const pins = Object.entries(pinsFor(instance)).flatMap(([prop, pin]) => {
		const bound = instance.bind?.[prop]
		if (pin.bus && pin.dir === "out") {
			return [[prop, noop]]
		}
		if (pin.bus) {
			const names = busBits(doc.outputs, bound)
			const bits = names.map((name) => outputs[name] === 1)
			const bused = busedPins(instance)
			return bused.length > 0
				? bused.map((name, i) => [name, bits[i] === true])
				: [[prop, bits.reduce((total, on) => total * 2 + (on ? 1 : 0), 0)]]
		}
		if (pin.dir === "out") {
			return [[prop, setters[bound] ?? noop]]
		}
		return bound === undefined || bound === null ? [] : [[prop, outputs[bound] === 1]]
	})
	
	return { x: instance.at[0], y: instance.at[1], ...instance.props, ...Object.fromEntries(pins) }
}

// The parts a truth table or state machine shows, with `propsFor` saying how each is driven.
export const Bench = ({ doc, propsFor, overlay, children }) => {
	return <Circuit width={`${doc.size[0]}px`} height={`${doc.size[1]}px`}>
		{doc.instances.filter(isHtmlPart).map((instance) => {
			const { Component } = PARTS[instance.component]
			return <Component key={instance.id} {...propsFor(instance)} />
		})}
		
		{overlay}
		
		<CircuitSVG>
			<BackdropLayer backdrops={doc.backdrops} />
			{children}
			{doc.instances.filter((instance) => !isHtmlPart(instance)).map((instance) => {
				return <PlacedPart key={instance.id} instance={instance} partProps={propsFor(instance)} />
			})}
			<LabelLayer circuit={doc} />
		</CircuitSVG>
	</Circuit>
}
