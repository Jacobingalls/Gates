import {useState} from "react";

import { Circuit, CircuitSVG } from "../Circuit"
import { Wire } from "../../Components/Wires"
import { Led } from "../../Components/Outputs/Led"
import { KeyboardButton } from "../../Components/Buttons/KeyboardButton.js"
import { NorGate } from "../../Components/Gates/OrGates"
import { AndGate } from "../../Components/Gates/AndGates"
import { NotGate } from "../../Components/Gates/NotGates"

import { DLatch } from "../../Components/Memory/DLatch"
import { SRLatch } from "../../Components/Memory/SRLatch"

export const DLatchCircuit = ({ version }) => {
	if ( version === "block" ) {
		return <DLatchBlockCircuit />
	} else if ( version === "half-gates" ) {
		return <DLatchHalfGatesCircuit />
	} else if ( version === "gates" ) {
		return <DLatchGatesCircuit />
	} else {
		return <p>Unknown version `{version}`...</p>
	}
}

export const DLatchBlockCircuit = () => {
	const [d, setD] = useState(false);
	const [en, setEn] = useState(false); 
	const [q, setQ] = useState(false);
	
	return <Circuit height="150px" width="280px">
	
		<KeyboardButton 
			x={10} y={30}
			output={setD}
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={80}
			output={setEn}
			keyboard="2"
		/>
		
		<CircuitSVG>
			<Wire path="M50,50 h100" on={d} />
			<Wire path="M50,100 h25 v-20 h25" on={en} />
			
			<DLatch x="100" y="25" d={d} en={en} setQ={setQ} />
			
			<Wire path="M200,50 h50" on={q} />
			<Wire path="M200,80 h50" on={!q} />
			
			<Led x={260} y={50} on={q} />
			<Led x={260} y={80} on={!q} />
		</CircuitSVG>
	</Circuit>
}

export const DLatchHalfGatesCircuit = () => {
	
	// SR Latch
	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false); 
	const [w3, setW3] = useState(false); 
	const [w4, setW4] = useState(false); 
	
	// AND Gates
	const [d, setD] = useState(false);
	const [notD, setNotD] = useState(false);
	const [en, setEn] = useState(false); 
	
	return <Circuit width="580px" height="250px">
	
		<KeyboardButton 
			x={10} y={35}
			output={setD}
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={185}
			output={setEn}
			keyboard="2"
		/>
		
		<CircuitSVG>
		
			{/* AND Gates */}
			<g>
				<Wire path="M50,50 h250 M100,50 v90 h50" on={d} />
				
				<Wire path="M195,140 h45
				a 10 10, 0, 0, 1, 20 0
				h50" on={notD} />
				
				<Wire path="M50,205 h200 v-50 h50 
				  M250,155 v-95 h50" on={en} />
				
				<AndGate x={300} y={30} input1={d} input2={en} output={setW1} />
				<AndGate x={300} y={120} input1={notD} input2={en} output={setW4} />
				<NotGate x={150} y={115} input={d} output={setNotD} />
			</g>
			
			<Wire path="M350,55 h25 v30 h25" on={w1} />
			<Wire path="M350,145 h25 v-30 h25" on={w4} />
			
			<SRLatch x={400} y={60} s={w1} r={w4} setQ={setW3} setNotQ={setW2} />
			
			<Wire path="M500,85 h50" on={w3} />
			<Wire path="M500,115 h50" on={w2} />
			
			<Led x={560} y={85} on={w3} />
			<Led x={560} y={115} on={w2} />
			
		</CircuitSVG>
	</Circuit>
}

export const DLatchGatesCircuit = () => {
	
	// SR Latch
	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false); 
	const [w3, setW3] = useState(false); 
	const [w4, setW4] = useState(false); 
	
	// AND Gates
	const [d, setD] = useState(false);
	const [notD, setNotD] = useState(false);
	const [en, setEn] = useState(false); 
	
	return <Circuit width="620px" height="250px">
	
		<KeyboardButton 
			x={10} y={35}
			output={setD}
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={185}
			output={setEn}
			keyboard="2"
		/>
		
		<CircuitSVG>
		
			{/* AND Gates */}
			<g>
				<Wire path="M50,50 h100 M100,50 v90 h140
				a 10 10, 0, 0, 1, 20 0
				h50" on={d} />
				<Wire path="M195,50 h110" on={notD} />
				<Wire path="M50,205 h200 v-50 h50 
				  M250,155 v-95 h50" on={en} />
				
				<AndGate x={300} y={30} input1={notD} input2={en} output={setW1} />
				<AndGate x={300} y={120} input1={d} input2={en} output={setW4} />
				<NotGate x={150} y={25} input={d} output={setNotD} />
			</g>
			
			{/* SR Latch */}
			<g transform={`translate(300,0)`}>
				<Wire path="M50,55 h30 l5,-5 h70" on={w1} />
				<Wire path="M50,145 h30 l5,5 h70" on={w4} />
				
				<Wire path="M200,55 h50 L100,140 h60 M200,55 h100" on={w3} />
				<Wire path="M200,145 h50 L100,60 h60 M200,145 h100" on={w2} />
				
				<NorGate x={150} y={30} input1={w1} input2={w2} output={(v) => {setTimeout(() => {setW3(v)}, 1)}} />
				<NorGate x={150} y={120} input1={w3} input2={w4} output={setW2} />
				
				<Led x={300} y={55} on={w3} />
				<Led x={300} y={145} on={w2} />
			</g>
		</CircuitSVG>
	</Circuit>
}