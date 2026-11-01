import { useEffect } from "react";

import { Block, BlockLabel } from "../Block"

const DIGIT_SPACING = 20
const FIRST_DIGIT = 25
const BCD_SIZE = [120, 50]

// How many decimal digits the largest number of this many bits needs.
export const digitCount = (width) => `${2n ** BigInt(width) - 1n}`.length

// Double dabble: walks the bits from the top, doubling the digits each time, and adds 3
// to any digit of 5 or more first so that its doubling carries into the next digit.
// Digits come back with the ones first.
export const toBcd = (value, digits) => {
	const bits = BigInt(value).toString(2)
	
	return [...bits].reduce((bcd, bit) => {
		const adjusted = bcd.map((digit) => digit >= 5 ? digit + 3 : digit)
		return adjusted.map((digit, i) => ((digit << 1) & 15) | (i === 0 ? Number(bit) : adjusted[i - 1] >> 3))
	}, Array(digits).fill(0))
}

const digitY = (digit, digits) => FIRST_DIGIT + (digits - 1 - digit) * DIGIT_SPACING

// Output pins run from the top digit down, so they read like the number.
export const bcdShape = ({ width }) => {
	const digits = digitCount(width)
	const pins = Array.from({ length: digits }, (_, digit) => [`setDigit${digit}`, {
		at: [BCD_SIZE[0], digitY(digit, digits)], dir: "out", bus: true, width: 4,
	}])
	
	return {
		size: [BCD_SIZE[0], Math.max(BCD_SIZE[1], digitY(0, digits) + FIRST_DIGIT)],
		pins: { value: { at: [0, FIRST_DIGIT], dir: "in", bus: true, width }, ...Object.fromEntries(pins) },
	}
}

export const Bcd = ({ x, y, value, width, ...props }) => {
	const digits = toBcd(value ?? 0, digitCount(width))
	const { size } = bcdShape({ width })
	
	useEffect(() => {
		digits.forEach((digit, i) => props[`setDigit${i}`](digit))
	}, [digits.join()]);
	
	return <Block title="BCD" x={x} y={y} width={size[0]} height={size[1]}>
		<BlockLabel x={10} y={FIRST_DIGIT}>IN</BlockLabel>
		{digits.map((digit, i) => {
			return <BlockLabel key={i} x={size[0] - 10} y={digitY(i, digits.length)} align="end" on={digit > 0}>
				D{i} ({digit})
			</BlockLabel>
		})}
	</Block>
}
