import "./StateMachine.css"

import { useMemo, useState } from "react";
import classNames from "classnames";

import { Bench } from "./Bench"
import { machineAssertions, machineProps, setSignal, startMachine } from "./machine"
import { pinsFor } from "./parts"
import { STATE_RADIUS, stateOutputLines, transitionLabel, transitionShape } from "./stateGeometry"

const START_ARROW = 26
const OUTPUT_DROP = 14

const TransitionLine = ({ machine, transition, on }) => {
	const { path, arrow, label } = transitionShape(machine, transition)
	
	return <g className={classNames("machine-transition", { on })}>
		<path d={path} />
		<polygon points={arrow} />
		<text text-anchor="middle" x={label[0]} y={label[1] - 5}>{transitionLabel(machine, transition)}</text>
	</g>
}

const StateCircle = ({ machine, state, on }) => {
	const [x, y] = state.at
	
	return <g className={classNames("machine-state", { on })}>
		<circle cx={x} cy={y} r={STATE_RADIUS} />
		<text text-anchor="middle" dominant-baseline="middle" x={x} y={y}>{state.name}</text>
		{stateOutputLines(machine, state).map((line, i) => {
			return <text
				key={line}
				className="machine-output"
				text-anchor="middle"
				dominant-baseline="middle"
				x={x} y={y + STATE_RADIUS + OUTPUT_DROP * (i + 1)}
			>
				{line}
			</text>
		})}
		{machine.initial === state.id && <path
			className="machine-start"
			d={`M${x - STATE_RADIUS - START_ARROW},${y} h${START_ARROW - 8} m-6,-5 l6,5 l-6,5`}
		/>}
	</g>
}

export const StateGraph = ({ machine, activeState, activeTransition }) => {
	return <>
		{machine.transitions.map((transition) => {
			return <TransitionLine
				key={transition.id}
				machine={machine}
				transition={transition}
				on={transition.id === activeTransition}
			/>
		})}
		{machine.states.map((state) => {
			return <StateCircle key={state.id} machine={machine} state={state} on={state.id === activeState} />
		})}
	</>
}

export const StateMachineDiagram = ({ machine }) => {
	const [run, setRun] = useState(() => startMachine(machine));
	
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
	
	return <Bench doc={machine} propsFor={propsFor}>
		<StateGraph machine={machine} activeState={run.state} activeTransition={run.taken} />
	</Bench>
}
