// Every combination of values, counting up with the first entry most significant.
export const combinations = (sizes) => sizes.reduce((rows, size) => rows.flatMap((row) => {
	return Array.from({ length: size }, (_, value) => [...row, value])
}), [[]])
