import {useEffect} from "react";

export const OrGate = ({x, y, input1, input2, output}) => {
	
	useEffect(() => {
	  output((input1 === true) || (input2 === true));
	}, [input1, input2]);
  
	return <g transform={`translate(${x},${y})`}>
		<path 
		  class="gate"
		  d="M0,5 
			a 25 25, 0, 0, 1, 0 40
			a 50 50, 0, 0, 0, 50 -20
			a 50 50, 0, 0, 0, -50 -20
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

export const NorGate = ({x, y, input1, input2, output}) => {
	
	useEffect(() => {
	  output(!((input1 === true) || (input2 === true)));
	}, [input1, input2]);
  
	return <g transform={`translate(${x},${y})`}>
		<path 
		  class="gate"
		  d="M0,5 
			a 25 25, 0, 0, 1, 0 40
			a 50 50, 0, 0, 0, 45 -20
			a 50 50, 0, 0, 0, -45 -20
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