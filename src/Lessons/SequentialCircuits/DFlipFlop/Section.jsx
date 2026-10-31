import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"

import circuit from "./Circuit.json"
import usingDLatch from "./UsingDLatch.json"
import gates from "./Gates.json"

export const DFlipFlopSection = () => {
  
  const [version, setVersion] = useState("block");
  
  return <div className="section">
	<div className="header">
	  <h1>D Flip-Flop</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["block", "half-gates", "gates"]} 
		  titles={["Component", "Using D Latch", "All Gates"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "block" && <CircuitDiagram circuit={circuit} /> }
	{ version === "half-gates" && <CircuitDiagram circuit={usingDLatch} /> }
	{ version === "gates" && <CircuitDiagram circuit={gates} /> }
  </div>
}
