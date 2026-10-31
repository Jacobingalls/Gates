import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"

import circuit from "./Circuit.json"
import wires from "./Wires.json"

export const BusLabelsSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Labels</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["diagram", "wires"]} 
		  titles={["Diagram", "Wires"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "diagram" && <CircuitDiagram circuit={circuit} /> }
	{ version === "wires" && <CircuitDiagram circuit={wires} /> }
  </div>
}
