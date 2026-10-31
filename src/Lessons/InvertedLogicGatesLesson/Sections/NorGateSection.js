import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { TwoInputGateCircuit, TwoInputTruthTableCircuit } from "../../../Circuits/TwoInputGateCircuits"
import { NorGate } from "../../../Components/Gates/OrGates"

export const NorGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Nor Gate</h1>
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
	{ version === "diagram" && <TwoInputGateCircuit Gate={ NorGate } /> }
	{ version === "table" && <TwoInputTruthTableCircuit fn={(a, b) => { return !(a || b) }} /> }
  </div>
}