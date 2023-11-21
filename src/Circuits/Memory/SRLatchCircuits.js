import {useState} from "react";

import { Circuit, CircuitSVG } from "../Circuit"
import { Wire } from "../../Components/Wires"
import { Led } from "../../Components/Outputs/Led"
import { KeyboardButton } from "../../Components/Buttons/KeyboardButton.js"
import { NorGate } from "../../Components/Gates/OrGates"

import { SRLatch } from "../../Components/Memory/SRLatch"

export const SRLatchCircuit = ({ version }) => {
	if ( version === "block" ) {
		return <SRLatchBlockCircuit />
	} else if ( version === "gates" ) {
		return <SRLatchGatesCircuit />
	} else {
		return <p>Unknown version `{version}`...</p>
	}
}

export const SRLatchBlockCircuit = () => {
	
	const [s, setS] = useState(false);
	const [r, setR] = useState(false); 
	const [q, setQ] = useState(false); 
	const [notQ, setNotQ] = useState(false);
	
	return <Circuit height="150px" width="280px">
	
		<KeyboardButton 
			x={10} y={30}
			output={setS}
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={80}
			output={setR}
			keyboard="2"
		/>
		
		<CircuitSVG>
			<Wire path="M50,50 h100" on={s} />
			<Wire path="M50,100 h25 v-20 h25" on={r} />
			
			<SRLatch x="100" y="25" s={s} r={r} setQ={setQ} setNotQ={setNotQ} />
			
			<Wire path="M200,50 h50" on={q} />
			<Wire path="M200,80 h50" on={notQ} />
			
			<Led x={260} y={50} on={q} />
			<Led x={260} y={80} on={notQ} />
		</CircuitSVG>
	</Circuit>
}

export const SRLatchGatesCircuit = () => {
  
  const [w1, setW1] = useState(false);
  const [w2, setW2] = useState(false); 
  const [w3, setW3] = useState(false); 
  const [w4, setW4] = useState(false); 
  
  return <Circuit height="200px" width="320px">
	
	  <KeyboardButton 
		x={10} y={30}
		output={setW1}
		keyboard="1"
	  />
	  
	  <KeyboardButton 
		x={10} y={130}
		output={setW4}
		keyboard="2"
	  />
	  
	  <CircuitSVG>
		<Wire path="M50,50 h110" on={w1} />
		<Wire path="M50,150 h110" on={w4} />
		
		<Wire path="M200,55 h50 L100,140 h60 M200,55 h100" on={w3} />
		<Wire path="M200,145 h50 L100,60 h60 M200,145 h100" on={w2} />
		
		<NorGate x={150} y={30} input1={w1} input2={w2} output={(v) => {setTimeout(() => {setW3(v)}, 1)}} />
		<NorGate x={150} y={120} input1={w3} input2={w4} output={setW2} />
		
		<Led x={300} y={55} on={w3} />
		<Led x={300} y={145} on={w2} />
	  </CircuitSVG>
  </Circuit>
}