import {useEffect} from "react";

export const NotGate = ({x, y, input, output}) => {
	
	useEffect(() => {
	  output(input !== true);
	}, [input, output]);
  
	return <g transform={`translate(${x},${y})`}>
		{<path 
		  class="gate"
		  d="M0,5 l40,20 l-40,20 z"
		/>}
		<circle 
			class="gate"
			cx="40" cy="25" r="5"
		/>
		
		{/* <rect 
		  x="0" y="0" 
		  width="50"
		  height="50"
		  stroke="red"
		  fill="transparent"
		  stroke-width="1"
		/> */}
	</g>
}