import "./TrafficLight.css"

import classNames from "classnames";

import { Led } from "./Led";

const WIDTH = 50
const LAMP_X = 25
const FIRST_LAMP = 20
const LAMP_SPACING = 30
const BOTTOM_ROOM = 20
const LENS_RADIUS = 11
const LAMP_RADIUS = 10

const title = (word) => `${word[0].toUpperCase()}${word.slice(1)}`
const ball = (color) => ({ pin: color, color, label: title(color) })
const arrow = (color, direction) => ({ pin: `${color}Arrow`, color, direction, label: `${title(color)} Arrow` })

const BALLS = [ball("red"), ball("yellow"), ball("green")]

const turnVersions = (direction, name) => ({
	[`green${name}`]: { title: `Green ${name} Arrow`, lamps: [...BALLS, arrow("green", direction)] },
	[`red${name}`]: { title: `Red + ${name} Arrows`, lamps: [ball("red"), arrow("yellow", direction), arrow("green", direction)] },
	[`arrows${name}`]: { title: `All ${name} Arrows`, lamps: [arrow("red", direction), arrow("yellow", direction), arrow("green", direction)] },
	[`five${name}`]: { title: `Five Lamps, ${name}`, lamps: [...BALLS, arrow("yellow", direction), arrow("green", direction)] },
})

// Every way the lamps can stack, top to bottom. Each lamp gets its own input.
export const TRAFFIC_VERSIONS = {
	standard: { title: "Standard", lamps: BALLS },
	...turnVersions("left", "Left"),
	...turnVersions("right", "Right"),
}

const lampY = (i) => FIRST_LAMP + i * LAMP_SPACING

export const trafficLightShape = ({ mode }) => {
	const { lamps } = TRAFFIC_VERSIONS[mode]
	return {
		size: [WIDTH, lampY(lamps.length - 1) + BOTTOM_ROOM],
		pins: Object.fromEntries(lamps.map(({ pin, label }, i) => {
			return [pin, { at: [0, lampY(i)], dir: "in", label: () => label }]
		})),
	}
}

// An arrow sits on a dark lens, unlike a ball, which fills its own.
const ArrowLamp = ({ y, color, direction, on }) => {
	return <g transform={`translate(${LAMP_X},${y}) scale(${direction === "right" ? -1 : 1},1)`}>
		<circle className="turn-lens" r={LENS_RADIUS} />
		<path className={classNames("led", "turn-arrow", color, { on })} d="M-9,0 l7.5,-7.5 v5 h10.5 v5 h-10.5 v5 z" />
	</g>
}

export const TrafficLight = ({ x, y, mode, ...inputs }) => {
	const { lamps } = TRAFFIC_VERSIONS[mode]
	
	return <g transform={`translate(${x},${y})`}>
		<rect className="traffic-light" width={WIDTH} height={trafficLightShape({ mode }).size[1]} rx="10" />
		{lamps.map(({ pin, color, direction }, i) => {
			const on = inputs[pin] === true
			return direction === undefined
				? <Led key={pin} x={LAMP_X} y={lampY(i)} r={LAMP_RADIUS} color={color} on={on} />
				: <ArrowLamp key={pin} y={lampY(i)} color={color} direction={direction} on={on} />
		})}
	</g>
}
