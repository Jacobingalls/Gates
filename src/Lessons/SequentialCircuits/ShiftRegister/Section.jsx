import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"

import circuit from "./Circuit.json"
import usingDFlipFlops from "./UsingDFlipFlops.json"

export const ShiftRegisterSection = () => {
  
  const [version, setVersion] = useState("block");
  
  return <div className="section">
	<div className="header">
	  <h1>Shift Register</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["block", "d-flip-flops"]} 
		  titles={["Component", "Using D Flip-Flops"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "block" && <CircuitDiagram circuit={circuit} /> }
	{ version === "d-flip-flops" && <CircuitDiagram circuit={usingDFlipFlops} /> }
  </div>
}
