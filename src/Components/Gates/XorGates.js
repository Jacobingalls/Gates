import {useEffect} from "react";

export const XorGate = ({x, y, input1, input2, output}) => {
	
	useEffect(() => {
	  output((input1 === true) !== (input2 === true));
	}, [input1, input2, output]);
  
	return <g transform={`translate(${x},${y})`}>
		<path 
		  class="gate-line"
		  d="M-1,5 a 21 21, 0, 0, 1, 0 40"
		/>
		
		<path 
		  class="gate"
		  d="M10,5 
			a 25 25, 0, 0, 1, 0 40
			a 50 50, 0, 0, 0, 40 -20
			a 50 50, 0, 0, 0, -40 -20
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

export const XnorGate = ({x, y, input1, input2, output}) => {
	
	useEffect(() => {
	  output((input1 === true) === (input2 === true));
	}, [input1, input2, output]);
  
	return <g transform={`translate(${x},${y})`}>
		<path 
		  class="gate-line"
		  d="M-1,5 a 21 21, 0, 0, 1, 0 40"
		/>
		
		<path 
		  class="gate"
		  d="M10,5 
			a 25 25, 0, 0, 1, 0 40
			a 50 50, 0, 0, 0, 35 -20
			a 50 50, 0, 0, 0, -35 -20
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