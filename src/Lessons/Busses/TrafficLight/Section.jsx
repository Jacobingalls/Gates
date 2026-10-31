import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"

import circuit from "./Circuit.json"

export const BusTrafficLightSection = () => {
  return <div className="section">
	<div className="header">
	  <h1>Inputs and Outputs</h1>
	  <div>
	  </div>
	</div>
	<CircuitDiagram circuit={circuit} />
  </div>
}
