import { bcdShape, digitCount } from "../Components/Math/Bcd"
import { SEVEN_SEGMENT_SIZE } from "../Components/Outputs/SevenSegment"

const MARGIN = 20
const CLOCK_AT = [MARGIN, MARGIN]
const COUNTER_X = 200
const BCD_X = 400
const ROW_GAP = 50
const DIGIT_SPACING = 75
const DIGIT_PIN_Y = 40
const CHANNEL = 10
const TICK_RISE = 25
const ROW_INSET = 30
const DEMO_FREQUENCY = 20
const MAX_DEMO_BITS = 53

// A Number Display, zoomed in: a BCD block with one Seven Segment per digit, showing
// each digit's bus as a hex number. A clock and counter stand in for what's driving it.
export const zoomedDisplay = (instance) => {
	const { width } = instance.props
	const digits = digitCount(width)
	const bcd = bcdShape({ width })
	const rowY = MARGIN + bcd.size[1] + ROW_GAP
	const rowX = BCD_X + bcd.size[0] + ROW_INSET
	const placeX = (digit) => rowX + (digits - 1 - digit) * DIGIT_SPACING
	const [counterY, bcdY] = [MARGIN, MARGIN]
	
	const instances = [
		{ id: "clock", component: "Clock", at: CLOCK_AT, props: { frequency: DEMO_FREQUENCY, duty: 50, controlType: "enable" } },
		{ id: "counter", component: "Counter", at: [COUNTER_X, counterY], props: { modulo: 2 ** Math.min(width, MAX_DEMO_BITS) } },
		{ id: "bcd", component: "Bcd", at: [BCD_X, bcdY], props: { width } },
		...Array.from({ length: digits }, (_, digit) => ({
			id: `digit_${digit}`, component: "SevenSegment", at: [placeX(digit), rowY], props: { mode: "hex", color: instance.props.color },
		})),
	]
	
	const nets = [
		{ id: "clock_line", connect: ["clock.output", "counter.clk"], route: [[[CLOCK_AT[0] + 140, MARGIN + 25], [COUNTER_X, counterY + 25]]] },
		{ id: "value", width, connect: ["counter.setValue", "bcd.value"], route: [[[COUNTER_X + 140, counterY + 25], [BCD_X, bcdY + 25]]] },
		...Array.from({ length: digits }, (_, digit) => {
			const start = [BCD_X + bcd.size[0], bcdY + bcd.pins[`setDigit${digit}`].at[1]]
			const channelX = placeX(digit) - CHANNEL
			const end = [placeX(digit), rowY + DIGIT_PIN_Y]
			return {
				id: `bus_${digit}`, width: 4, connect: [`bcd.setDigit${digit}`, `digit_${digit}.value`],
				route: [[start, [channelX, start[1]], [channelX, end[1]], end]],
				tick: [channelX, rowY - TICK_RISE],
			}
		}),
	]
	
	const [digitWidth, digitHeight] = SEVEN_SEGMENT_SIZE
	return { format: 1, kind: "circuit", size: [placeX(0) + digitWidth + MARGIN, rowY + digitHeight + MARGIN], instances, nets }
}
