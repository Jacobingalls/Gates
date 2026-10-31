export const Circuit = ({ children, width, height }) => {
	return <div className="circuit">
		<div 
			className="circuit-inner" 
			style={{
				"width": width || "350px", 
				"height": height || "100px"
			}}
		>
			{children}
		</div>
	</div>
}

export const CircuitSVG = ({ children }) => {
	return <svg height="100%" width="100%">
		{children}
	</svg>
}
