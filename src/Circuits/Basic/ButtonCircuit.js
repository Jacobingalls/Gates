import {useState} from "react";

import { Circuit, CircuitSVG } from "../Circuit"
import { TruthTable, TruthTableRow, TruthTableHeader, TruthTableCell } from "../TruthTable"

import { Wire } from "../../Components/Wires"
import { Led } from "../../Components/Outputs/Led"
import { KeyboardButton } from "../../Components/Buttons/KeyboardButton.js"

export const ButtonCircuit = ({ version }) => {
	if ( version === "diagram" ) {
		return <ButtonDiagramCircuit />
	} else if ( version === "table" ) {
		return <ButtonTableCircuit />
	} else {
		return <p>Unknown version `{version}`...</p>
	}
}

export const ButtonDiagramCircuit = () => {
  const [w1, setW1] = useState(false);
  
  return <Circuit>
		<KeyboardButton 
			x={10} y={30}
			output={setW1} 
			keyboard="1"
		/>
		<CircuitSVG>
			<Wire path="M50,50 h280" on={w1} />
			<Led x={330} y={50} on={w1} />
		</CircuitSVG>
	</Circuit>
}

export const ButtonTableCircuit = () => {
	
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
					0
				</TruthTableCell>
			</TruthTableRow>
			
			<TruthTableRow on={w1 === true}>
				<TruthTableCell lastInput={true}>
					1
				</TruthTableCell>
				<TruthTableCell>
					1
				</TruthTableCell>
			</TruthTableRow>
		</TruthTable>
		
		<CircuitSVG>
			<Led x={330} y={50} on={w1} />
		</CircuitSVG>
	</Circuit>
}
