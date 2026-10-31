import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { TwoInputGateCircuit, TwoInputTruthTableCircuit } from "../../../Circuits/TwoInputGateCircuits"
import { NandGate } from "../../../Components/Gates/AndGates"

export const NandGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Nand Gate</h1>
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
	{ version === "diagram" && <TwoInputGateCircuit Gate={ NandGate } /> }
	{ version === "table" && <TwoInputTruthTableCircuit fn={(a, b) => { return !(a && b) }} /> }
  </div>
}