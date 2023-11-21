import {useState} from "react";

import { Circuit, CircuitSVG } from "../Circuit"
import { TruthTable, TruthTableRow, TruthTableHeader, TruthTableCell } from "../TruthTable"

import { NotGate } from "../../Components/Gates/NotGates";
import { Wire } from "../../Components/Wires"
import { Led } from "../../Components/Outputs/Led"
import { KeyboardButton } from "../../Components/Buttons/KeyboardButton.js"

export const NotGateCircuit = ({ version }) => {
	if ( version === "diagram" ) {
		return <NotGateDiagramCircuit />
	} else if ( version === "table" ) {
		return <NotGateTableCircuit />
	} else {
		return <p>Unknown version `{version}`...</p>
	}
}

export const NotGateDiagramCircuit = () => {

	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false); 
	
	return <Circuit>
		<KeyboardButton 
		x={10} y={30}
		output={setW1} 
		keyboard="1"
		/>
		
		<CircuitSVG>
			<Wire path="M50,50 h100" on={w1} />
			<Wire path="M200,50 h130" on={w2} />
			<NotGate x={150} y={25} input={w1} output={setW2} />
			<Led x={330} y={50} on={w2} />
		</CircuitSVG>
	</Circuit>
}

export const NotGateTableCircuit = () => {
	
	const [w1, setW1] = useState(false);
	return <Circuit>
	
		<KeyboardButton 
			x={10} y={30}
			output={setW1} 
			keyboard="1"
		/>
	
		<TruthTable x={110} y={7}>
			<TruthTableRow>
				<TruthTableHeader lastInput={true}>
					Button
				</TruthTableHeader>
				<TruthTableHeader>
					Light
				</TruthTableHeader>
			</TruthTableRow>
			
			<TruthTableRow on={w1 === false}>
				<TruthTableCell lastInput={true}>
					0
				</TruthTableCell>
				<TruthTableCell>
					1
				</TruthTableCell>
			</TruthTableRow>
			
			<TruthTableRow on={w1 === true}>
				<TruthTableCell lastInput={true}>
					1
				</TruthTableCell>
				<TruthTableCell>
					0
				</TruthTableCell>
			</TruthTableRow>
		</TruthTable>
		
		<CircuitSVG>
			<Led x={330} y={50} on={!w1} />
		</CircuitSVG>
	</Circuit>
}