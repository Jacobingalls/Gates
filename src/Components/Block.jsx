import { createContext, useContext } from "react";
import classNames from "classnames";

// How the surrounding part is rotated and flipped, so its text can stay readable.
export const Placement = createContext({ rotation: 0, flipX: false, flipY: false, showTitle: true });

const DIRECTIONS = { start: [1, 0], end: [-1, 0], middle: [0, 0] }

const OVERLINE_RISE = 10
// Turned sideways, a label can sit close enough to the block's edge to hide its line.
const SIDEWAYS_OVERLINE_RISE = 7

// Cancels the part's rotation and flips around a label's anchor, and picks the
// text alignment that keeps the label running the way it did on the plain part.
const useUprightText = (x, y, align, direction) => {
	const { rotation, flipX, flipY } = useContext(Placement)
	
	const scaleX = flipX ? -1 : 1
	const scaleY = flipY ? -1 : 1
	const [dx, dy] = direction ?? DIRECTIONS[align]
	const radians = rotation * Math.PI / 180
	const run = Math.round(dx * scaleX * Math.cos(radians) - dy * scaleY * Math.sin(radians))
	
	return {
		anchor: run > 0 ? "start" : run < 0 ? "end" : "middle",
		transform: `translate(${x},${y}) scale(${scaleX},${scaleY}) rotate(${-rotation}) translate(${-x},${-y})`,
	}
}

export const Block = ({children, x, y, height, width, title}) => {
	const { showTitle } = useContext(Placement)
	
	return <g transform={`translate(${x},${y})`}>
		<rect x="0" y="0" height={height} width={width} className="gate" />
		{showTitle && <BlockLabel x={width / 2} y={height + 20} align="middle" direction={[0, 1]}>{title}</BlockLabel>}
		{children}
	</g>
}

const LabelText = ({x, y, anchor, on, children}) => {
	return <text 
		className={classNames({"on": on === true})}
		text-anchor={anchor}
		dominant-baseline="middle" 
		x={x} y={y}
	>
		{children}
	</text>
}

// `mark` is drawn with the text, so it stays beside it however the part is turned.
export const BlockLabel = ({x, y, children, align, on, direction, mark}) => {
	const { anchor, transform } = useUprightText(x, y, align || "start", direction)
	
	return <g transform={transform}>
		{mark}
		<LabelText x={x} y={y} anchor={anchor} on={on}>{children}</LabelText>
	</g>
}

export const InvertedBlockLabel = ({x, y, children, align, on, width}) => {
	const { anchor, transform } = useUprightText(x, y, align || "start")
	const { rotation } = useContext(Placement)
	const rise = rotation % 180 === 0 ? OVERLINE_RISE : SIDEWAYS_OVERLINE_RISE
	
	const length = Math.abs(width)
	const lineStart = { start: x, middle: x - length / 2, end: x - length }[anchor]
	
	return <g transform={transform}>
		<path d={
			`M${lineStart},${y-rise} h${length}`
		} className={classNames("text-line", {"on": on === true})} />
		<LabelText x={x} y={y} anchor={anchor} on={on}>{children}</LabelText>
	</g>
}
