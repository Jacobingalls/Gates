import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"
import { TruthTableDiagram } from "../../../Circuits/TruthTableDiagram"

import circuit from "./Circuit.json"
import gates from "./Gates.json"
import truthTable from "./TruthTable.json"

export const XorGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Xor Gate</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["diagram", "gates", "table"]} 
		  titles={["Diagram", "As Gates", "Truth Table"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "diagram" && <CircuitDiagram circuit={circuit} /> }
	{ version === "gates" && <CircuitDiagram circuit={gates} /> }
	{ version === "table" && <TruthTableDiagram table={truthTable} /> }
  </div>
}
