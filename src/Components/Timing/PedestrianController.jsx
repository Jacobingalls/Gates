import "./PedestrianController.css"

import { useEffect, useReducer, useRef } from "react";
import classNames from "classnames";

import { Block, BlockLabel } from "../Block"
import { PHASE_TITLES, pedestrianOutputs, pressPedestrian, startPedestrian, stepPedestrian } from "./pedestrian"

const WIDTH = 230
const FIRST_PIN = 20
const PIN_SPACING = 20
const OUTPUT_COUNT = 10
const BOTTOM_ROOM = 20
const HEIGHT = FIRST_PIN + PIN_SPACING * (OUTPUT_COUNT - 1) + BOTTOM_ROOM
const STATE_DROP = 40

const pinY = (i) => FIRST_PIN + i * PIN_SPACING

const INPUTS = [["request", "Request"], ["start", "Start"], ["clk", "Clock"]]
const SECONDS = [["walkSeconds", "Walk Seconds"], ["flashSeconds", "Flash Seconds"]]
const OUTPUTS = [
	["setWalk", "walk", "Walk"], ["setWait", "wait", "Wait"], ["setShowTime", "showTime", "Show Time"], ["setTime", "time", "Time"],
	["setRequested", "requested", "Requested"], ["setHold", "hold", "Hold Cross Traffic"],
	["setLocator", "locator", "Locator"], ["setWaitSpeech", "waitSpeech", "Wait Speech"],
	["setWalkSign", "walkSign", "Walk Sign"], ["setPerc", "perc", "Walk Perc"],
]

const SOUND_OUTPUTS = ["walkSign", "waitSpeech", "locator", "perc"]
const MARK_WIDTH = 11
const MARK_GAP = 4

// A little speaker after a sound's label, against the block's edge.
const SoundMark = ({ right, y, on }) => {
	return <g className={classNames("sound-mark", { on })} transform={`translate(${right - MARK_WIDTH},${y - 6})`}>
		<path className="sound-mark-cone" d="M0,3.5 v3 h2 l3,2.5 v-8 l-3,2.5 z" />
		<path d="M7,3.5 a2.5,2.5 0 0,1 0,3 M9,1.5 a5.5,5.5 0 0,1 0,7" />
	</g>
}

export const pedestrianControllerShape = ({ width }) => ({
	size: [WIDTH, HEIGHT],
	pins: Object.fromEntries([
		...INPUTS.map(([prop, label], i) => [prop, { at: [0, pinY(i)], dir: "in", optional: true, label: () => label }]),
		...SECONDS.map(([prop, label], i) => [prop, {
			at: [0, pinY(INPUTS.length + i)], dir: "in", bus: true, width, optional: true, label: () => label,
		}]),
		...OUTPUTS.map(([prop, name, label], i) => [prop, {
			at: [WIDTH, pinY(i)], dir: "out", optional: true, label: () => label, ...(name === "time" ? { bus: true, width } : {}),
		}]),
	]),
})

const reducer = (run, action) => {
	return action.type === "press" ? pressPedestrian(run, action) : stepPedestrian(run, action)
}

// A bus reading 0 is one nothing's driving, so the seconds fall back to the part's own settings.
const secondsFrom = (signal, setting) => Number(signal || 0) || setting

// The Pedestrian Crossing lesson's controller as one part. Everything it times is counted from
// `clk`, which should run at 10 Hz, and it only moves on that clock's rising edges.
export const PedestrianController = ({
	x, y, request, start, clk, walkSeconds, flashSeconds, walkTime, flashTime, ...pins
}) => {
	const [run, dispatch] = useReducer(reducer, undefined, startPedestrian);
	const wasHigh = useRef(false);
	const walk = secondsFrom(walkSeconds, walkTime)
	const flash = secondsFrom(flashSeconds, flashTime)
	const outputs = pedestrianOutputs(run)
	
	useEffect(() => {
		dispatch({ type: "press", request: request === true, start: start === true })
	}, [request, start]);
	
	useEffect(() => {
		const rising = clk === true && !wasHigh.current
		wasHigh.current = clk === true
		if (rising) {
			dispatch({ type: "tick", walkSeconds: walk, flashSeconds: flash })
		}
	}, [clk, walk, flash]);
	
	OUTPUTS.forEach(([prop, name]) => {
		useEffect(() => {
			pins[prop](outputs[name])
		}, [outputs[name], pins[prop]]);
	})
	
	return <Block title="Pedestrian Controller" x={x} y={y} width={WIDTH} height={HEIGHT}>
		{INPUTS.map(([prop, label], i) => {
			const on = { request, start, clk }[prop]
			return <BlockLabel key={prop} x={10} y={pinY(i)} on={on}>{label}</BlockLabel>
		})}
		<BlockLabel x={10} y={pinY(INPUTS.length)}>Walk ({walk} s)</BlockLabel>
		<BlockLabel x={10} y={pinY(INPUTS.length + 1)}>Flash ({flash} s)</BlockLabel>
		<BlockLabel x={WIDTH / 2} y={HEIGHT + STATE_DROP} align="middle" direction={[0, 1]}>(State: {PHASE_TITLES[run.phase]})</BlockLabel>
		{OUTPUTS.map(([prop, name, label], i) => {
			const value = outputs[name]
			const on = value === true || value > 0
			const sound = SOUND_OUTPUTS.includes(name)
			const right = WIDTH - 10
			return <BlockLabel
				key={prop}
				x={sound ? right - MARK_WIDTH - MARK_GAP : right}
				y={pinY(i)}
				align="end"
				on={on}
				mark={sound && <SoundMark right={right} y={pinY(i)} on={on} />}
			>
				{name === "time" ? `Time (${value})` : label}
			</BlockLabel>
		})}
	</Block>
}
