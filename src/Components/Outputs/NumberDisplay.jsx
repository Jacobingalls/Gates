import { digitCount, toBcd } from "../Math/Bcd"
import { SEVEN_SEGMENT_SIZE, SMALL_SCALE, SMALL_SEVEN_SEGMENT_SIZE, SevenSegment, hexSegments } from "./SevenSegment"

const digitSize = (small) => small ? SMALL_SEVEN_SEGMENT_SIZE : SEVEN_SEGMENT_SIZE

export const numberDisplayShape = ({ width, small }) => {
	const [digitWidth, height] = digitSize(small)
	
	return {
		size: [digitCount(width) * digitWidth, height],
		pins: { value: { at: [0, height / 2], dir: "in", bus: true, width } },
	}
}

// One digit per decimal place of the bus, reading left to right, top digit first.
// `decimalPlaces` puts a point that many digits in from the right, and it only shows the
// number differently: `value` is the same either way.
export const NumberDisplay = ({ x, y, value, width, small, color, decimalPlaces }) => {
	const digits = toBcd(value ?? 0, digitCount(width))
	
	return digits.map((digit, i) => {
		const place = digits.length - 1 - i
		return <SevenSegment
			key={i}
			x={x + place * digitSize(small)[0]}
			y={y}
			scale={small ? SMALL_SCALE : 1}
			color={color}
			segments={hexSegments(digit)}
			point={i === decimalPlaces && i > 0 ? true : undefined}
		/>
	})
}
