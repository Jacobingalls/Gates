import "./StateMachine.css"

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";

import { Bench } from "./Bench"
import { jumpTo, machineAssertions, machineProps, setSignal, startMachine } from "./machine"
import { pinsFor } from "./parts"
import { LABEL_LIFT, LABEL_LINE_HEIGHT, NAME_LINE_HEIGHT, fitName, radiusOf, stateCaption, stateOutputLines, transitionLabel, transitionShape } from "./stateGeometry"

const START_ARROW = 26
const OUTPUT_DROP = 14
const CARD_WIDTH = 240
const CARD_GAP = 13
const CHEVRON_INSET = 16

const LABEL_PADDING = 1

// A faint backing to lift text off whatever runs under it. SVG text can't have a background, so
// this measures it, whenever `measureOn` says it may have changed, and puts a box behind it.
const BackedText = ({ measureOn, children }) => {
	const text = useRef(null);
	const [box, setBox] = useState(null);
	
	useLayoutEffect(() => {
		const { x, y, width, height } = text.current.getBBox()
		setBox({ x: x - LABEL_PADDING, y: y - LABEL_PADDING, width: width + LABEL_PADDING * 2, height: height + LABEL_PADDING * 2 })
	}, [measureOn]);
	
	return <>
		{box && <rect className="machine-label-back" rx="3" {...box} />}
		<g ref={text}>{children}</g>
	</>
}

const TransitionLine = ({ machine, transition }) => {
	const { path, arrow } = transitionShape(machine, transition)
	
	return <>
		<path d={path} />
		<polygon points={arrow} />
	</>
}

const TransitionLabel = ({ machine, transition }) => {
	const { label } = transitionShape(machine, transition)
	const lines = transitionLabel(machine, transition)
	
	return <BackedText measureOn={`${lines.join("\n")} ${label}`}>
		{lines.map((line, i) => {
			return <text
				key={i}
				text-anchor="middle"
				x={label[0]} y={label[1] - LABEL_LIFT - (lines.length - 1 - i) * LABEL_LINE_HEIGHT}
			>
				{line}
			</text>
		})}
	</BackedText>
}

// A state with a summary shows it, and `explain` opens a card with what it asserts. Only
// keyboard focus does that, where there's a `setFocused`, since a click focuses a state too and
// the card should go when the pointer does. `goTo` makes a click jump the machine to the state.
const StateCircle = ({ machine, state, on, explain, goTo }) => {
	const [x, y] = state.at
	const radius = radiusOf(state)
	const name = useMemo(() => fitName(state.name, radius), [state.name, radius])
	const caption = stateCaption(machine, state)
	const explained = explain !== undefined && state.summary !== undefined && stateOutputLines(machine, state).length > 0
	const opener = explained ? {
		onMouseEnter: () => explain.setHovered(state.id),
		onMouseLeave: () => explain.setHovered(null),
	} : {}
	const focusable = explained && explain.setFocused !== undefined ? {
		tabIndex: 0,
		"aria-label": state.name,
		onFocus: (event) => event.currentTarget.matches(":focus-visible") && explain.setFocused(state.id),
		onBlur: () => explain.setFocused(null),
	} : {}
	
	return <g
		className={classNames("machine-state", { on, explained, clickable: goTo !== undefined })}
		onClick={goTo && (() => goTo(state.id))}
		{...opener}
		{...focusable}
	>
		<circle cx={x} cy={y} r={radius} />
		{name.lines.map((line, i) => {
			return <text
				key={i}
				text-anchor="middle"
				dominant-baseline="middle"
				x={x} y={y + (i - (name.lines.length - 1) / 2) * name.size * NAME_LINE_HEIGHT}
				style={{ fontSize: name.size }}
			>
				{line}
			</text>
		})}
		{caption.length > 0 && <BackedText measureOn={`${caption.join("\n")} ${x},${y},${radius}`}>
			{caption.map((line, i) => {
				return <text
					key={i}
					className="machine-output"
					text-anchor="middle"
					dominant-baseline="middle"
					x={x} y={y + radius + OUTPUT_DROP * (i + 1)}
				>
					{line}
				</text>
			})}
		</BackedText>}
		{machine.initial === state.id && <path
			className="machine-start"
			d={`M${x - radius - START_ARROW},${y} h${START_ARROW - 8} m-6,-5 l6,5 l-6,5`}
		/>}
	</g>
}

// Hangs from the bottom of the circle, over the caption. Given a `width`, it slides sideways to
// stay inside it, with the chevron staying on the state. `origin` is where the diagram's 0,0 is.
export const StateCard = ({ machine, state, origin = [0, 0], width }) => {
	const [x, y] = state.at
	const centered = x - CARD_WIDTH / 2
	const left = width === undefined ? centered : Math.max(0, Math.min(centered, width - CARD_WIDTH))
	const top = y + radiusOf(state) + CARD_GAP
	const chevron = Math.max(CHEVRON_INSET, Math.min(x - left, CARD_WIDTH - CHEVRON_INSET))
	
	return <div
		className="machine-card"
		role="tooltip"
		style={{ left: left + origin[0], top: top + origin[1], width: CARD_WIDTH, "--chevron-x": `${chevron}px` }}
	>
		<ul>{stateOutputLines(machine, state).map((line) => <li key={line}>{line}</li>)}</ul>
	</div>
}

export const StateGraph = ({ machine, activeState, activeTransition, explain, goTo }) => {
	return <>
		{machine.transitions.map((transition) => {
			return <g key={transition.id} className={classNames("machine-transition", { on: transition.id === activeTransition })}>
				<TransitionLine machine={machine} transition={transition} />
			</g>
		})}
		{machine.states.map((state) => {
			return <StateCircle key={state.id} machine={machine} state={state} on={state.id === activeState} explain={explain} goTo={goTo} />
		})}
		{machine.transitions.map((transition) => {
			return <g key={transition.id} className={classNames("machine-transition", { on: transition.id === activeTransition })}>
				<TransitionLabel machine={machine} transition={transition} />
			</g>
		})}
	</>
}

// `cards` is for the editor. A lesson leaves it off, so its states just show their summaries.
export const StateMachineDiagram = ({ machine, cards }) => {
	const [run, setRun] = useState(() => startMachine(machine));
	const [hovered, setHovered] = useState(null);
	const [focused, setFocused] = useState(null);
	
	const setters = useMemo(() => Object.fromEntries(machine.instances.flatMap((instance) => {
		return Object.entries(pinsFor(instance)).filter(([, pin]) => pin.dir === "out").map(([prop]) => {
			const terminal = `${instance.id}.${prop}`
			return [terminal, (value) => setRun((current) => {
				return setSignal(machine, current, terminal, typeof value === "function" ? value(current.signals[terminal]) : value)
			})]
		})
	})), [machine]);
	
	const assertions = machineAssertions(machine, run)
	const propsFor = (instance) => machineProps(machine, instance, setters, run.signals, assertions)
	
	const goTo = (state) => setRun((current) => jumpTo(current, state))
	
	const explaining = machine.states.find(({ id }) => id === (hovered ?? focused))
	const card = explaining && <StateCard machine={machine} state={explaining} width={machine.size[0]} />
	
	return <Bench doc={machine} propsFor={propsFor} overlay={card}>
		<StateGraph
			machine={machine}
			activeState={run.state}
			activeTransition={run.taken}
			explain={cards ? { setHovered, setFocused } : undefined}
			goTo={goTo}
		/>
	</Bench>
}
