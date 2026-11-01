import "./SevenSegment.css"

import classNames from "classnames";

export const SEVEN_SEGMENT_SIZE = [50, 80]
export const SMALL_SCALE = .5

// Segments a to g, clockwise from the top, with g across the middle.
const SEGMENTS = [
	"M11,6 l3,-3 h22 l3,3 l-3,3 h-22 z",
	"M41,8 l3,3 v22 l-3,3 l-3,-3 v-22 z",
	"M41,44 l3,3 v22 l-3,3 l-3,-3 v-22 z",
	"M11,74 l3,-3 h22 l3,3 l-3,3 h-22 z",
	"M9,44 l3,3 v22 l-3,3 l-3,-3 v-22 z",
	"M9,8 l3,3 v22 l-3,3 l-3,-3 v-22 z",
	"M11,40 l3,-3 h22 l3,3 l-3,3 h-22 z",
]

const HEX_DIGITS = [
	0b1111110, 0b0110000, 0b1101101, 0b1111001, 0b0110011, 0b1011011, 0b1011111, 0b1110000,
	0b1111111, 0b1111011, 0b1110111, 0b0011111, 0b1001110, 0b0111101, 0b1001111, 0b1000111,
]

export const hexSegments = (value) => SEGMENTS.map((_, i) => ((HEX_DIGITS[value] >> (6 - i)) & 1) === 1)

// `color` lights the segments in place of the usual red.
export const SevenSegment = ({x, y, segments, scale = 1, color}) => {
	return <g transform={`translate(${x},${y}) scale(${scale})`}>
		<rect className="seven-segment" width={SEVEN_SEGMENT_SIZE[0]} height={SEVEN_SEGMENT_SIZE[1]} rx="4" />
		{SEGMENTS.map((d, i) => {
			const lit = segments[i] === true
			return <path
				key={i}
				d={d}
				className={classNames("segment", {"on": lit})}
				style={lit && color !== undefined ? { fill: color } : undefined}
			/>
		})}
	</g>
}
