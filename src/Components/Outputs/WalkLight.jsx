import "./WalkLight.css"

import { SevenSegment, hexSegments } from "./SevenSegment"

// The face is drawn at this scale, so these sizes are before it's applied.
const SCALE = .5
const WIDTH = 150
const HEIGHT = 100
const DIGIT_SCALE = [.6, 1]
const DIGIT_LEFT = 75
const DIGIT_STEP = 34
const DIGIT_TOP = 10
const DIGIT_LIMIT = 100
const MESH_ID = "walk-light-mesh"

const bit = (y, label, optional) => ({ at: [0, y], dir: "in", optional, label: () => label })

export const walkLightShape = ({ width }) => ({
	size: [WIDTH * SCALE, HEIGHT * SCALE],
	pins: {
		walk: bit(10, "Walk", false),
		wait: bit(20, "Wait", false),
		showTime: bit(30, "Show Time", true),
		time: { ...bit(40, "Time", true), bus: true, width },
	},
})

const Hand = () => {
	return <g className="walk-hand">
		<rect x="19" y="46" width="37" height="38" rx="11" />
		<path d="M23,56 V27 M32,52 V19 M41,52 V17 M50,56 V24 M54,68 L68,50" />
	</g>
}

const Person = () => {
	return <g className="walk-person">
		<circle cx="37" cy="20" r="8" />
		<path d="M37,33 L36,57 M37,34 L23,48 M37,34 L52,46 M36,57 L26,86 M36,57 L49,86" />
	</g>
}

const Digit = ({ x, value }) => {
	return <g className="walk-digit" transform={`translate(${x},${DIGIT_TOP}) scale(${DIGIT_SCALE})`}>
		<SevenSegment x={0} y={0} segments={hexSegments(value)} />
	</g>
}

// Only a display, styled on a California crossing signal: each input shows its own part
// of the face, and whatever drives it decides when, including flashing the hand.
export const WalkLight = ({x, y, walk, wait, showTime, time}) => {
	const seconds = Number(time ?? 0) % DIGIT_LIMIT
	
	return <g transform={`translate(${x},${y}) scale(${SCALE})`}>
		<defs>
			<pattern id={MESH_ID} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<path className="walk-mesh-line" d="M0,0 H7 M0,0 V7" />
			</pattern>
		</defs>
		<rect className="walk-housing" width={WIDTH} height={HEIGHT} rx="12" />
		{wait === true && <Hand />}
		{walk === true && <Person />}
		{showTime === true && seconds >= 10 && <Digit x={DIGIT_LEFT} value={Math.floor(seconds / 10)} />}
		{showTime === true && <Digit x={DIGIT_LEFT + DIGIT_STEP} value={seconds % 10} />}
		<rect fill={`url(#${MESH_ID})`} width={WIDTH} height={HEIGHT} rx="12" />
	</g>
}
