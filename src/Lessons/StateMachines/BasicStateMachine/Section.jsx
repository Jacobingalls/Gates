import {useState} from "react";

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