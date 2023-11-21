import {useState} from "react";

import { Circuit, CircuitSVG } from "../Circuit"
import { TruthTable, TruthTableRow, TruthTableHeader, TruthTableCell } from "../TruthTable"
import { Wire } from "../../Components/Wires"
import { Led } from "../../Components/Outputs/Led"
import { KeyboardButton } from "../../Components/Buttons/KeyboardButton.js"

export const TwoInputGateCircuit = ({Gate}) => {
	
	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false); 
	const [w3, setW3] = useState(false); 

	return <Circuit height="150px">
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
			<Wire path="M50,50 h50 v15 h75" on={w1} />
			<Wire path="M50,100 h50 v-15 h75" on={w2} />
			<Wire path="M215,75 h115" on={w3} />
			<Gate x={165} y={50} input1={w1} input2={w2} output={setW3} />
			<Led x={330} y={75} on={w3} />
		</CircuitSVG>
	</Circuit>
}

export const TwoInputTruthTableCircuit = ({fn}) => {
	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false);
	
	return <Circuit height="150px">
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
		
		<TruthTable x={85} y={3}>
			<TruthTableRow>
				<TruthTableHeader>
					Btn. 1
				</TruthTableHeader>
				<TruthTableHeader lastInput={true}>
					Btn. 2
				</TruthTableHeader>
				<TruthTableHeader>
					Light
				</TruthTableHeader>
			</TruthTableRow>
			
			<TruthTableRow on={w1 === false && w2 === false}>
				<TruthTableCell>
					0
				</TruthTableCell>
				<TruthTableCell lastInput={true}>
					0
				</TruthTableCell>
				<TruthTableCell>
					{fn(false, false) ? 1 : 0}
				</TruthTableCell>
			</TruthTableRow>
			
			<TruthTableRow on={w1 === false && w2 === true}>
				<TruthTableCell>
					0
				</TruthTableCell>
				<TruthTableCell lastInput={true}>
					1
				</TruthTableCell>
				<TruthTableCell>
					{fn(false, true) ? 1 : 0}
				</TruthTableCell>
			</TruthTableRow>
			
			<TruthTableRow on={w1 === true && w2 === false}>
				<TruthTableCell>
					1
				</TruthTableCell>
				<TruthTableCell lastInput={true}>
					0
				</TruthTableCell>
				<TruthTableCell>
					{fn(true, false) ? 1 : 0}
				</TruthTableCell>
			</TruthTableRow>
			
			<TruthTableRow on={w1 === true && w2 === true}>
				<TruthTableCell>
					1
				</TruthTableCell>
				<TruthTableCell lastInput={true}>
					1
				</TruthTableCell>
				<TruthTableCell>
					{fn(true, true) ? 1 : 0}
				</TruthTableCell>
			</TruthTableRow>
		</TruthTable>
		
		<CircuitSVG>
			<Led x={330} y={75} on={fn(w1 === true, w2 === true)} />
		</CircuitSVG>
	</Circuit>
}