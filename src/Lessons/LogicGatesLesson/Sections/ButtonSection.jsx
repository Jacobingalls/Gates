import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { TwoInputGateCircuit, TwoInputTruthTableCircuit } from "../../../Circuits/TwoInputGateCircuits"

import { XnorGate } from "../../../Components/Gates/XorGates"
import { NotGate } from "../../../Components/Gates/NotGates"
import { AndGate } from "../../../Components/Gates/AndGates"
import { OrGate, NorGate } from "../../../Components/Gates/OrGates"
import { Wire } from "../../../Components/Wires"
import { Led } from "../../../Components/Outputs/Led"
import { KeyboardButton } from "../../../Components/Buttons/KeyboardButton.jsx"

import { Circuit, CircuitSVG } from "../../../Circuits/Circuit"
import { TruthTable, TruthTableRow, TruthTableHeader, TruthTableCell } from "../../../Circuits/TruthTable"

export const ButtonSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Getting Started</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["diagram", "table"]} 
		  titles={["Diagram", "Truth Table"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "diagram" && <ButtonCircuit version="diagram" /> }
	{ version === "table" && <ButtonCircuit version="table" /> }
  </div>
}


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
