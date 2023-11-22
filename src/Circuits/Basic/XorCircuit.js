import {useState} from "react";

import { Circuit, CircuitSVG } from "../Circuit"
import { Wire } from "../../Components/Wires"
import { Led } from "../../Components/Outputs/Led"
import { KeyboardButton } from "../../Components/Buttons/KeyboardButton.js"
import { NotGate } from "../../Components/Gates/NotGates"
import { AndGate } from "../../Components/Gates/AndGates"
import { OrGate, NorGate } from "../../Components/Gates/OrGates"

export const XorCircuit = ({ inverted }) => {
	
	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false); 
	const [notW1, setNotW1] = useState(false); 
	const [notW2, setNotW2] = useState(false); 
	
	const [w3, setW3] = useState(false); 
	const [w4, setW4] = useState(false); 
	const [w5, setW5] = useState(false); 
	
	return <Circuit width="500px" height="200px">
		<KeyboardButton 
			x={10} y={30}
			output={setW1}
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={80}
			output={setW2}
			keyboard="2"
		/>
		
		<CircuitSVG>
		
			<Wire path="
				M50,50 h25 v-10 h175 
				M75,50 v40
				a 10 10, 0, 0, 1, 0 20
				v45 h75
			" on={w1} />
			<Wire path="
				M50,100 h50 v-25 h50
				M100,100 v20 h150
			" on={w2} />
			<Wire path="
				M195,155 h30 v-20 h25
			" on={notW1} />
			<Wire path="
				M195,75 h30 v-20 h25
			" on={notW2} />
			<Wire path="M300,45 h25 v30 h30" on={w3} />
			<Wire path="M300,125 h25 v-30 h30" on={w4} />
			<Wire path="M400,85 h70" on={w5} />
		
			<NotGate x={150} y={130} input={w1} output={setNotW1} />
			<NotGate x={150} y={50} input={w2} output={setNotW2} />
		
			<AndGate x={250} y={20} input1={w1} input2={notW2} output={setW3} />
			<AndGate x={250} y={100} input1={w2} input2={notW1} output={setW4} />
			
			{ (inverted !== true) && <OrGate x={350} y={60} input1={w3} input2={w4} output={setW5} /> }
			{ (inverted === true) && <NorGate x={350} y={60} input1={w3} input2={w4} output={setW5} /> }
			 
			 <Led x={480} y={85} on={w5} />
		</CircuitSVG>
	</Circuit>
}