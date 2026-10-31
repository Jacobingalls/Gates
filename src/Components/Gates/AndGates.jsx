import {useEffect} from "react";

export const AndGate = ({x, y, input1, input2, output}) => {
	
	useEffect(() => {
	  output((input1 === true) && (input2 === true));
	}, [input1, input2, output]);
  
	return <g transform={`translate(${x},${y})`}>
		<path 
		  class="gate"
		  d="M0,5 
			h 30
			a 20 20, 0, 0, 1, 0 40 
			h -30 
			Z"
		/>
		
		{/*<rect 
		  x="0" y="0" 
		  width="50"
		  height="50"
		  stroke="red"
		  fill="transparent"
		  stroke-width="1"
		/>*/}
	</g>
}

export const NandGate = ({x, y, input1, input2, output}) => {
	
	useEffect(() => {
	  output(!((input1 === true) && (input2 === true)));
	}, [input1, input2, output]);
  
	return <g transform={`translate(${x},${y})`}>
		<path 
		  class="gate"
		  d="M0,5 
			h 20
			a 20 20, 0, 0, 1, 0 40 
			h -20 
			Z"
		/>
		
		<circle 
			class="gate"
			cx="45" cy="25" r="5"
		/>
		
		{/*<rect 
		  x="0" y="0" 
		  width="50"
		  height="50"
		  stroke="red"
		  fill="transparent"
		  stroke-width="1"
		/>*/}
	</g>
}