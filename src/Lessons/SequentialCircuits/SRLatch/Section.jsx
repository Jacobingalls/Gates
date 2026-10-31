import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"

import circuit from "./Circuit.json"
import gates from "./Gates.json"

export const SRLatchSection = () => {
  
  const [version, setVersion] = useState("block");
  
  return <div className="section">
	<div className="header">
	  <h1>SR Latch</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["block", "gates"]} 
		  titles={["Component", "All Gates"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "block" && <CircuitDiagram circuit={circuit} /> }
	{ version === "gates" && <CircuitDiagram circuit={gates} /> }
  </div>
}
