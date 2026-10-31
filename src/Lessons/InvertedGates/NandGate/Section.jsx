import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"
import { TruthTableDiagram } from "../../../Circuits/TruthTableDiagram"

import circuit from "./Circuit.json"
import truthTable from "./TruthTable.json"

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
	{ version === "diagram" && <CircuitDiagram circuit={circuit} /> }
	{ version === "table" && <TruthTableDiagram table={truthTable} /> }
  </div>
}
