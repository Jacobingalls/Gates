import { digitCount, toBcd } from "../Math/Bcd"
import { SEVEN_SEGMENT_SIZE, SMALL_SCALE, SevenSegment, hexSegments } from "./SevenSegment"

const DIGIT_GAP = 5

export const numberDisplayShape = ({ width, small }) => {
	const digits = digitCount(width)
	const scale = small ? SMALL_SCALE : 1
	const [digitWidth, height] = SEVEN_SEGMENT_SIZE.map((length) => length * scale)
	const gap = DIGIT_GAP * scale
	
	return {
		size: [digits * (digitWidth + gap) - gap, height],
		pins: { value: { at: [0, height / 2], dir: "in", bus: true, width } },
	}
}

// One digit per decimal place of the bus, reading left to right, top digit first.
export const NumberDisplay = ({ x, y, value, width, small, color }) => {
	const digits = toBcd(value ?? 0, digitCount(width))
	const scale = small ? SMALL_SCALE : 1
	
	return digits.map((digit, i) => {
		const place = digits.length - 1 - i
		return <SevenSegment
			key={i}
			x={x + place * (SEVEN_SEGMENT_SIZE[0] + DIGIT_GAP) * scale}
			y={y}
			scale={scale}
			color={color}
			segments={hexSegments(digit)}
		/>
	})
}
