import { StateMachineDiagram } from "../../../Circuits/StateMachineDiagram"

import machine from "./StateMachine.json"

export const PedestrianCrossingSection = () => {
  return <div className="section">
	<div className="header">
	  <h1>Pedestrian Crossing</h1>
	  <div>
	  </div>
	</div>
	<StateMachineDiagram machine={machine} />
  </div>
}
