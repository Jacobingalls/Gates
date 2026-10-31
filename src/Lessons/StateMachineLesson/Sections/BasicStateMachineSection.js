import {useState} from "react";

import { Circuit, CircuitSVG } from "../../../Circuits/Circuit"
import { Wire } from "../../../Components/Wires"
import { Led } from "../../../Components/Outputs/Led"
import { KeyboardButton } from "../../../Components/Buttons/KeyboardButton.js"
import { NorGate } from "../../../Components/Gates/OrGates"
import { AndGate } from "../../../Components/Gates/AndGates"
import { NotGate } from "../../../Components/Gates/NotGates"
import { DFlipFlop } from "../../../Components/Memory/DFlipFlop"
import { DLatch } from "../../../Components/Memory/DLatch"

import { SegmentedControl } from "../../../App/SegmentedControl"

export const BasicStateMachineSection = () => {
	const [version, setVersion] = useState("block");
	
	return <div className="section">
		<div className="header">
			<h1>Basic State Machine</h1>
			<div>
				View as:&nbsp;
				<SegmentedControl 
					values={["block", "diagram"]} 
					titles={["Component", "Diagram"]}
					value={version}
					setValue={setVersion}
				/>
			</div>
		</div>
		
		{ version === "block" && <BasicStateMachineBlockCircuit /> }
		{ version === "diagram" && <BasicStateMachineStateDiagram /> }
	</div>
}

const BasicStateMachineBlockCircuit = () => {
	return ""
}

const BasicStateMachineStateDiagram = () => {
	return ""
}