import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"
import { KeyboardButton } from "../../../Components/Buttons/KeyboardButton"
import { Circuit, CircuitSVG } from "../../../Circuits/Circuit"
import { Wire, Bus, BusLabel } from "../../../Components/Wires"
import { Led } from "../../../Components/Outputs/Led"
import { TrafficLight } from "../../../Components/Outputs/TrafficLight"
import { Counter } from "../../../Components/Math/Counter"

export const BusTrafficLightSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Inputs and Outputs</h1>
	  <div>
	  </div>
	</div>
	<BusTrafficDiagramSection />
  </div>
}

const BusTrafficDiagramSection = () => {
	
	const [clock, setClock] = useState(false);
	const [value, setValue] = useState(false);
	
	return <Circuit width="470px" height="140px">
	
		<KeyboardButton 
			x={10} y={50}
			output={setClock} 
			keyboard="1"
		/>
	
		<CircuitSVG>
			<Wire path="M50,70 h105" on={clock} />
			<Bus path="M295,70 h105" label={{ "x": 350, "y": 70, "wires": 2 }} />
			<Counter setValue={setValue} x={155} y={45} clk={clock} modulo={4} />
			<TrafficLight x={400} y={20} value={value} />
		</CircuitSVG>
	</Circuit>
}