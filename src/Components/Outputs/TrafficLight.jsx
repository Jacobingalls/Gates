import "./TrafficLight.css"

import {Led} from "./Led";

export const TrafficLight = ({x, y, value}) => {
	return <g transform={`translate(${x},${y})`}>
		<path 
			className="traffic-light"
			d="	M0,10 v80 
				a10,10 0 0,0 10,10
				h30
				a10,10 0 0,0 10,-10
				v-80
				a10,10 0 0,0 -10,-10
				h-30
				a10,10 0 0,0 -10,10" 
		/>
		
		<Led x={25} y={20} color="red" on={value == 1} />
		<Led x={25} y={50} color="yellow" on={value == 2} />
		<Led x={25} y={80} color="green" on={value == 3} />
	</g>
}