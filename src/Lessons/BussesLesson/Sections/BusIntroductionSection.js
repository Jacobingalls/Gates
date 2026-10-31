import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"
import { KeyboardButton } from "../../../Components/Buttons/KeyboardButton"
import { Circuit, CircuitSVG } from "../../../Circuits/Circuit"
import { Wire, Bus, BusLabel } from "../../../Components/Wires"
import { Led } from "../../../Components/Outputs/Led"

export const BusIntroductionSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Bus</h1>
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
	{ version === "diagram" && <BusIntroductionDiagramCircuit /> }
	{ version === "wires" && <BusIntroductionWiresCircuit /> }
  </div>
}

const BusIntroductionDiagramCircuit = () => {
	const [w0, setW0] = useState(false);
	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false);
	const [w3, setW3] = useState(false);
	const [w4, setW4] = useState(false);
	const [w5, setW5] = useState(false);
	const [w6, setW6] = useState(false);
	const [w7, setW7] = useState(false);
	  
	return <Circuit width="600px" height="350px">
		<KeyboardButton 
			x={10} y={20}
			output={setW0} 
			keyboard="0"
		/>
		
		<KeyboardButton 
			x={10} y={60}
			output={setW1} 
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={100}
			output={setW2} 
			keyboard="2"
		/>
		
		<KeyboardButton 
			x={10} y={140}
			output={setW3} 
			keyboard="3"
		/>
		
		<KeyboardButton 
			x={10} y={180}
			output={setW4} 
			keyboard="4"
		/>
		
		<KeyboardButton 
			x={10} y={220}
			output={setW5} 
			keyboard="5"
		/>
		
		<KeyboardButton 
			x={10} y={260}
			output={setW6} 
			keyboard="6"
		/>
		
		<KeyboardButton 
			x={10} y={300}
			output={setW7} 
			keyboard="7"
		/>
		
		
		<CircuitSVG>
			<Wire path="M50,40  h100 m320,0 h100" on={w0} />
			<Wire path="M50,80  h100 m320,0 h100" on={w1} />
			<Wire path="M50,120 h100 m320,0 h100" on={w2} />
			<Wire path="M50,160 h100 m320,0 h100" on={w3} />
			<Wire path="M50,200 h100 m320,0 h100" on={w4} />
			<Wire path="M50,240 h100 m320,0 h100" on={w5} />
			<Wire path="M50,280 h100 m320,0 h100" on={w6} />
			<Wire path="M50,320 h100 m320,0 h100" on={w7} />
			
			<Bus 
				path="M150,30 v300 m0,-150 h320 m0,-150 v300" 
				label={{
					x: 310, y: 180,
					wires: "8",
					value: "Dunno"
				}}
			/>
			
			<BusLabel x={130} y={35}>[0]</BusLabel>
			<BusLabel x={130} y={75}>[1]</BusLabel>
			<BusLabel x={130} y={115}>[2]</BusLabel>
			<BusLabel x={130} y={155}>[3]</BusLabel>
			<BusLabel x={130} y={195}>[4]</BusLabel>
			<BusLabel x={130} y={235}>[5]</BusLabel>
			<BusLabel x={130} y={275}>[6]</BusLabel>
			<BusLabel x={130} y={315}>[7]</BusLabel>
			
			<BusLabel x={475} y={35}>[0]</BusLabel>
			<BusLabel x={475} y={75}>[1]</BusLabel>
			<BusLabel x={475} y={115}>[2]</BusLabel>
			<BusLabel x={475} y={155}>[3]</BusLabel>
			<BusLabel x={475} y={195}>[4]</BusLabel>
			<BusLabel x={475} y={235}>[5]</BusLabel>
			<BusLabel x={475} y={275}>[6]</BusLabel>
			<BusLabel x={475} y={315}>[7]</BusLabel>
			
			<Led x={580} y={40} on={w0} />
			<Led x={580} y={80} on={w1} />
			<Led x={580} y={120} on={w2} />
			<Led x={580} y={160} on={w3} />
			<Led x={580} y={200} on={w4} />
			<Led x={580} y={240} on={w5} />
			<Led x={580} y={280} on={w6} />
			<Led x={580} y={320} on={w7} />
		</CircuitSVG>
	</Circuit>
}

const BusIntroductionWiresCircuit = () => {
	
	const [w0, setW0] = useState(false);
	const [w1, setW1] = useState(false);
	const [w2, setW2] = useState(false);
	const [w3, setW3] = useState(false);
	const [w4, setW4] = useState(false);
	const [w5, setW5] = useState(false);
	const [w6, setW6] = useState(false);
	const [w7, setW7] = useState(false);
	  
	return <Circuit width="600px" height="350px">
		<KeyboardButton 
			x={10} y={20}
			output={setW0} 
			keyboard="0"
		/>
		
		<KeyboardButton 
			x={10} y={60}
			output={setW1} 
			keyboard="1"
		/>
		
		<KeyboardButton 
			x={10} y={100}
			output={setW2} 
			keyboard="2"
		/>
		
		<KeyboardButton 
			x={10} y={140}
			output={setW3} 
			keyboard="3"
		/>
		
		<KeyboardButton 
			x={10} y={180}
			output={setW4} 
			keyboard="4"
		/>
		
		<KeyboardButton 
			x={10} y={220}
			output={setW5} 
			keyboard="5"
		/>
		
		<KeyboardButton 
			x={10} y={260}
			output={setW6} 
			keyboard="6"
		/>
		
		<KeyboardButton 
			x={10} y={300}
			output={setW7} 
			keyboard="7"
		/>
		
		
		<CircuitSVG>
			<Wire path="M50,40  h100 h30 v105  h260     v-105 h30 h100" on={w0} />
			<Wire path="M50,80  h100 h20 v75   h260 h20 v-75  h20 h100" on={w1} />
			<Wire path="M50,120 h100 h10 v45   h260 h40 v-45  h10 h100" on={w2} />
			<Wire path="M50,160 h100     v15   h260 h60 v-15      h100" on={w3} />
			<Wire path="M50,200 h100     v-15  h260 h60 v15       h100" on={w4} />
			<Wire path="M50,240 h100 h10 v-45  h260 h40 v45   h10 h100" on={w5} />
			<Wire path="M50,280 h100 h20 v-75  h260 h20 v75   h20 h100" on={w6} />
			<Wire path="M50,320 h100 h30 v-105 h260     v105  h30 h100" on={w7} />
			
			<Led x={580} y={40} on={w0} />
			<Led x={580} y={80} on={w1} />
			<Led x={580} y={120} on={w2} />
			<Led x={580} y={160} on={w3} />
			<Led x={580} y={200} on={w4} />
			<Led x={580} y={240} on={w5} />
			<Led x={580} y={280} on={w6} />
			<Led x={580} y={320} on={w7} />
		</CircuitSVG>
	</Circuit>
}