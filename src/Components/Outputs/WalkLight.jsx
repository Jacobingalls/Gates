import "./WalkLight.css"

import { SevenSegment, hexSegments } from "./SevenSegment"

// The face is drawn at this scale, so these sizes are before it's applied.
const SCALE = .5
const WIDTH = 160
const TIMELESS_WIDTH = 80
const HEIGHT = 100
const DIGIT_SCALE = [.6, 1]
const DIGIT_LEFT = 80
const DIGIT_STEP = 34
const DIGIT_TOP = 10
const DIGIT_LIMIT = 100
const MESH_ID = "walk-light-mesh"

const SIDE_PINS = { walk: 10, wait: 30 }
const BOTTOM_PINS = { showTime: 50, time: 70 }

const bit = (at, label) => ({ at, dir: "in", label: () => label })
const bottomBit = (x, label) => ({ ...bit([x, HEIGHT * SCALE], label), side: "bottom", optional: true })

// Without `timer` the face narrows to just the hand and person, and has no time pins.
export const walkLightShape = ({ timer, width }) => ({
	size: [(timer ? WIDTH : TIMELESS_WIDTH) * SCALE, HEIGHT * SCALE],
	pins: {
		walk: { ...bit([0, SIDE_PINS.walk], "Walk"), optional: false },
		wait: { ...bit([0, SIDE_PINS.wait], "Wait"), optional: false },
		...(timer ? {
			showTime: bottomBit(BOTTOM_PINS.showTime, "Show Time"),
			time: { ...bottomBit(BOTTOM_PINS.time, "Time"), bus: true, width },
		} : {}),
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
export const WalkLight = ({x, y, walk, wait, timer, showTime, time}) => {
	const seconds = Number(time ?? 0) % DIGIT_LIMIT
	const faceWidth = timer ? WIDTH : TIMELESS_WIDTH
	
	return <g transform={`translate(${x},${y}) scale(${SCALE})`}>
		<defs>
			<pattern id={MESH_ID} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<path className="walk-mesh-line" d="M0,0 H7 M0,0 V7" />
			</pattern>
		</defs>
		<rect className="walk-housing" width={faceWidth} height={HEIGHT} rx="12" />
		{wait === true && <Hand />}
		{walk === true && <Person />}
		{timer && showTime === true && seconds >= 10 && <Digit x={DIGIT_LEFT} value={Math.floor(seconds / 10)} />}
		{timer && showTime === true && <Digit x={DIGIT_LEFT + DIGIT_STEP} value={seconds % 10} />}
		<rect fill={`url(#${MESH_ID})`} width={faceWidth} height={HEIGHT} rx="12" />
	</g>
}
