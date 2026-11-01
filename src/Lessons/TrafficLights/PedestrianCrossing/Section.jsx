import { useState } from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"
import { SoundToggle } from "../../../App/SoundToggle"
import { CircuitDiagram } from "../../../Circuits/CircuitDiagram"
import { StateMachineDiagram } from "../../../Circuits/StateMachineDiagram"
import { SoundModule } from "../../../Sounds/soundModules"

import circuit from "./Circuit.json"
import machine from "./StateMachine.json"

export const PedestrianCrossingSection = () => {
  const [version, setVersion] = useState("circuit");
  
  return <div className="section">
	<div className="header">
	  <h1>Pedestrian Crossing</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl
		  values={["circuit", "machine"]}
		  titles={["Circuit", "State Machine"]}
		  value={version}
		  setValue={setVersion}
		/>
		<SoundToggle module="pedestrian-crossing" />
	  </div>
	</div>
	<SoundModule.Provider value="pedestrian-crossing">
	  { version === "circuit" && <CircuitDiagram circuit={circuit} /> }
	  { version === "machine" && <StateMachineDiagram machine={machine} /> }
	</SoundModule.Provider>
  </div>
}
