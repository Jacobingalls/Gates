import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"

import circuit from "./Circuit.json"
import usingSRLatch from "./UsingSRLatch.json"
import gates from "./Gates.json"

export const DLatchSection = () => {
  
  const [version, setVersion] = useState("block");
  
  return <div className="section">
	<div className="header">
	  <h1>D Latch</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["block", "half-gates", "gates"]} 
		  titles={["Component", "Using SR Latch", "All Gates"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "block" && <CircuitDiagram circuit={circuit} /> }
	{ version === "half-gates" && <CircuitDiagram circuit={usingSRLatch} /> }
	{ version === "gates" && <CircuitDiagram circuit={gates} /> }
  </div>
}
