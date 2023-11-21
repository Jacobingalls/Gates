import {useState} from "react";

import { Circuit, CircuitSVG } from "../Circuit"
import { Wire } from "../../Components/Wires"
import { Led } from "../../Components/Outputs/Led"
import { KeyboardButton } from "../../Components/Buttons/KeyboardButton.js"
import { NorGate } from "../../Components/Gates/OrGates"
import { AndGate } from "../../Components/Gates/AndGates"
import { NotGate } from "../../Components/Gates/NotGates"
import { DFlipFlop } from "../../Components/Memory/DFlipFlop"
import { DLatch } from "../../Components/Memory/DLatch"

export const DFlipFlopCircuit = ({ version }) => {
	if ( version === "block" ) {
		return <DFlipFlopBlockCircuit />
	} else if ( version === "half-gates" ) {
		return <DFlipFlopHalfGatesCircuit />
	} else if ( version === "gates" ) {
		return <DFlipFlopGatesCircuit />
	} else {
		return <p>Unknown version `{version}`...</p>
	}
}

export const DFlipFlopBlockCircuit = () => {
	
	const [d, setD] = useState(false);
	const [clk, setClk] = useState(false); 
	const [q, setQ] = useState(false);
	
	return <Circuit height="150px" width="280px">
	
		<KeyboardButton 
			x={10} y={30}
			output={setD}
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={80}
			output={setClk}
			keyboard="2"
		/>
		
		<CircuitSVG>
			<Wire path="M50,50 h100" on={d} />
			<Wire path="M50,100 h25 v-20 h25" on={clk} />
			
			<DFlipFlop x="100" y="25" d={d} clk={clk} setQ={setQ} />
			
			<Wire path="M200,50 h50" on={q} />
			<Wire path="M200,80 h50" on={!q} />
			
			<Led x={260} y={50} on={q} />
			<Led x={260} y={80} on={!q} />
		</CircuitSVG>
	</Circuit>
}

export const DFlipFlopHalfGatesCircuit = () => {
	
	// AND Gates 1
	const [d, setD] = useState(false);
	const [clk, setClk] = useState(false); 
	const [notClk, setNotClk] = useState(false); 
	
	const [nextQ, setNextQ] = useState(false); 
	const [currentQ, setCurrentQ] = useState(false); 
	
	return <Circuit width="530px" height="250px">	
		<KeyboardButton 
			x={10} y={40}
			output={setD}
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={185}
			output={setClk}
			keyboard="2"
		/>
		
		<CircuitSVG>
			
			<Wire path="M50,55 h100" on={d} />
			<Wire path="M50,205 h50 v-120 h50 M100,205 h75" on={clk} />
			<Wire path="M220,205 h80 v-120 h50" on={notClk} />
			<Wire path="M250,55 h100" on={nextQ} />
			
			<DLatch x={150} y={30} d={d} en={clk} setQ={setNextQ} />
			<NotGate x={175} y={180} input={clk} output={setNotClk} />
			<DLatch x={350} y={30} d={nextQ} en={notClk} setQ={setCurrentQ} />
			
			<Wire path="M450,55 h50" on={currentQ} />
			<Wire path="M450,85 h50" on={!currentQ} />
			
			<Led x={510} y={55} on={currentQ} />
			<Led x={510} y={85} on={!currentQ} />
		</CircuitSVG>
	</Circuit>
}

export const DFlipFlopGatesCircuit = () => {
	
	// AND Gates 1
	const [d, setD] = useState(false);
	const [notD, setNotD] = useState(false);
	const [en, setEn] = useState(false); 
	const [notEn, setNotEn] = useState(false); 
	
	// SR Latch 1
	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false); 
	const [w3, setW3] = useState(false); 
	const [w4, setW4] = useState(false); 
	
	// SR Latch 2
	const [w21, setW21] = useState(false);
	const [w22, setW22] = useState(false); 
	const [w23, setW23] = useState(false); 
	const [w24, setW24] = useState(false); 
	
	return <Circuit width="880px" height="250px">	
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
			
			{/* AND Gates 1 */}
			<g>
				<Wire path="M50,50 h200
	  				M70,50 v90 h30" on={d} />
				<Wire path="M145,140 h45 a 10 10, 0, 0, 1, 20 0 h40" on={notD} />
				<Wire path="M50,205 h150 v-50 h50 
	  				M200,155 v-90 h50
	  				M200,205 h200" on={en} />
				
				<AndGate x={250} y={30} input1={d} input2={en} output={setW1} />
				<AndGate x={250} y={120} input1={notD} input2={en} output={setW4} />
				<NotGate x={100} y={115} input={d} output={setNotD} />
			</g>
			
			{/* SR Latch 1 */}
			<g transform={`translate(250,0)`}>
				<Wire path="M50,55 h30 l5,-5 h70" on={w1} />
				<Wire path="M50,145 h30 l5,5 h70" on={w4} />
				
				<Wire path="M200,55 h50 L100,140 h60 M200,55 h60 l5,-5 h60" on={w3} />
				<Wire path="M200,145 h50 L100,60 h60 M200,145 h55 l5,-5 h10 a 10 10, 0, 0, 1, 20 0 h20" on={w2} />
				
				<NorGate x={150} y={30} input1={w1} input2={w2} output={setW3} />
				<NorGate x={150} y={120} input1={w3} input2={w4} output={(v) => {setTimeout(() => {setW2(v)}, 1)}} />
				
				<Led x={600} y={55} on={w23} />
				<Led x={600} y={145} on={w22} />
			</g>
			
			{/* AND Gates 2 */}
			<g>
				<AndGate x={550} y={30} input1={w3} input2={notEn} output={setW21} />
				<AndGate x={550} y={120} input1={w2} input2={notEn} output={setW24} />
				<NotGate x={400} y={180} input={en} output={setNotEn} />
				<Wire path="M450,205 h80 v-55 h20 M530,150 v-90 h20" on={notEn} />
			</g>
			
			{/* SR Latch 2 */}
			<g transform={`translate(550,0)`}>
				<Wire path="M50,55 h30 l5,-5 h70" on={w21} />
				<Wire path="M50,145 h30 l5,5 h70" on={w24} />
				
				<Wire path="M200,55 h50 L100,140 h60 M200,55 h90" on={w23} />
				<Wire path="M200,145 h50 L100,60 h60 M200,145 h90" on={w22} />
				
				<NorGate x={150} y={30} input1={w21} input2={w22} output={setW23} />
				<NorGate x={150} y={120} input1={w23} input2={w24} output={(v) => {setTimeout(() => {setW22(v)}, 1)}} />
			</g>
		</CircuitSVG>
	</Circuit>
}