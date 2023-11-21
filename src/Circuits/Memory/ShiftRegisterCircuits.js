import {useState} from "react";

import { Circuit, CircuitSVG } from "../Circuit"
import { Wire } from "../../Components/Wires"
import { Led } from "../../Components/Outputs/Led"
import { KeyboardButton } from "../../Components/Buttons/KeyboardButton"
import { DFlipFlop } from "../../Components/Memory/DFlipFlop"
import { EightBitShiftRegister } from "../../Components/Memory/ShiftRegisters"

export const ShiftRegisterCircuit = ({ version }) => {
	if ( version === "block" ) {
		return <ShiftRegisterBlockCircuit />
	} else if ( version === "d-flip-flops" ) {
		return <ShiftRegisterDFlipFlopsCircuit />
	} else {
		return <p>Unknown version `{version}`...</p>
	}
}

export const ShiftRegisterBlockCircuit = () => {
	const [d, setD] = useState(false);
	const [clk, setClk] = useState(false);
	
	const [q0, setQ0] = useState(false);
	const [q1, setQ1] = useState(false);
	const [q2, setQ2] = useState(false);
	const [q3, setQ3] = useState(false);
	const [q4, setQ4] = useState(false);
	const [q5, setQ5] = useState(false);
	const [q6, setQ6] = useState(false);
	const [q7, setQ7] = useState(false);
	
	return <Circuit height="330px" width="280px">
	
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
		
			<EightBitShiftRegister 
				x={100} y={25} 
				d={d} clk={clk}
				setQ0={setQ0}
				setQ1={setQ1}
				setQ2={setQ2}
				setQ3={setQ3}
				setQ4={setQ4}
				setQ5={setQ5}
				setQ6={setQ6}
				setQ7={setQ7}
			/>
			
			<Led x={260} y={50} on={q0} />
			<Wire path="M200,50 h50" on={q0} />
			
			<Led x={260} y={80} on={q1} />
			<Wire path="M200,80 h50" on={q1} />
			
			<Led x={260} y={110} on={q2} />
			<Wire path="M200,110 h50" on={q2} />
			
			<Led x={260} y={140} on={q3} />
			<Wire path="M200,140 h50" on={q3} />
			
			<Led x={260} y={170} on={q4} />
			<Wire path="M200,170 h50" on={q4} />
			
			<Led x={260} y={200} on={q5} />
			<Wire path="M200,200 h50" on={q5} />
			
			<Led x={260} y={230} on={q6} />
			<Wire path="M200,230 h50" on={q6} />
			
			<Led x={260} y={260} on={q7} />
			<Wire path="M200,260 h50" on={q7} />
			
		</CircuitSVG>
	</Circuit>
}

export const ShiftRegisterDFlipFlopsCircuit = () => {
	
	const [d, setD] = useState(false);
	const [clk, setClk] = useState(false);
	
	const [q0, setQ0] = useState(false);
	const [q1, setQ1] = useState(false);
	const [q2, setQ2] = useState(false);
	const [q3, setQ3] = useState(false);
	const [q4, setQ4] = useState(false);
	const [q5, setQ5] = useState(false);
	const [q6, setQ6] = useState(false);
	const [q7, setQ7] = useState(false);
  
	return <Circuit height="400px" width="750px">
		<KeyboardButton 
			x={10} y={30}
			output={setD}
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={330}
			output={setClk}
			keyboard="2"
		/>
		
		<CircuitSVG>
		
			<Wire path="M50,50 h100" on={d} />
			<Wire path="
				M50,350 h525
				M125,350 v-95 h25
				M275,350 v-95 h25
				M425,350 v-95 h25
				M575,350 v-95 h25
				
				M75,350 v-200 h500
				M125,150 v-65 h25
				M275,150 v-65 h25
				M425,150 v-65 h25
				M575,150 v-65 h25
			" on={clk} />
			
			<Wire path="M250,55 h50 m-25,0 v-30" on={q0} />
			<Wire path="M400,55 h50 m-25,0 v-30" on={q1} />
			<Wire path="M550,55 h50 m-25,0 v-30" on={q2} />
			<Wire path="M700,55 h25 v-30 m0,30 v110 L100,170 v55 h50" on={q3} />
			
			<Wire path="M250,225 h50 m-25,0 v-30" on={q4} />
			<Wire path="M400,225 h50 m-25,0 v-30" on={q5} />
			<Wire path="M550,225 h50 m-25,0 v-30" on={q6} />
			<Wire path="M700,225 h25 v-30" on={q7} />
			
			<Led x={275} y={20} on={q0} />
			<Led x={425} y={20} on={q1} />
			<Led x={575} y={20} on={q2} />
			<Led x={725} y={20} on={q3} />
			
			<Led x={275} y={190} on={q4} />
			<Led x={425} y={190} on={q5} />
			<Led x={575} y={190} on={q6} />
			<Led x={725} y={190} on={q7} />
		
			<DFlipFlop x={150} y={30} d={d} clk={clk} setQ={setQ0} />
			<DFlipFlop x={300} y={30} d={q0} clk={clk} setQ={setQ1} />
			<DFlipFlop x={450} y={30} d={q1} clk={clk} setQ={setQ2} />
			<DFlipFlop x={600} y={30} d={q2} clk={clk} setQ={setQ3} />
			
			<DFlipFlop x={150} y={200} d={q3} clk={clk} setQ={setQ4} />
			<DFlipFlop x={300} y={200} d={q4} clk={clk} setQ={setQ5} />
			<DFlipFlop x={450} y={200} d={q5} clk={clk} setQ={setQ6} />
			<DFlipFlop x={600} y={200} d={q6} clk={clk} setQ={setQ7} />
		
		</CircuitSVG>
	</Circuit>
}