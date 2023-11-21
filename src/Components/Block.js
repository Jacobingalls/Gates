import classNames from "classnames";

export const Block = ({children, x, y, height, width, title}) => {
	return <g transform={`translate(${x},${y})`}>
		<rect x="0" y="0" height={height} width={width} className="gate" />
		<BlockLabel x={width / 2} y={height + 20} align="middle">{title}</BlockLabel>
		{children}
	</g>
}

export const BlockLabel = ({x, y, children, align, on}) => {
	return <text 
		className={classNames({"on": on === true})}
		text-anchor={align || "start" }
		dominant-baseline="middle" 
		x={x} y={y}
	>
		{children}
	</text>
}

export const InvertedBlockLabel = (props) => {
	return <g>
		<path d={
			`M${props.x},${props.y-10} h${props.width}`
		} className={classNames("text-line", {"on": props.on === true})} />
		<BlockLabel {...props} />
	</g>
}