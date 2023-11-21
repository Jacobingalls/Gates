import {useState} from "react";
import { SegmentedControl } from "../App/SegmentedControl"

import { SRLatchCircuit } from "../Circuits/Memory/SRLatchCircuits"
import { DLatchCircuit } from "../Circuits/Memory/DLatchCircuits"
import { DFlipFlopCircuit } from "../Circuits/Memory/DFlipFlopCircuits"
import { ShiftRegisterCircuit } from "../Circuits/Memory/ShiftRegisterCircuits"

import { LessonFooter } from "../App/LessonFooter"

export const SequentialCircuitsLesson = () => {
	return <div className="lesson">
		<h1>Sequential Circuits</h1>
		<SRLatchSection />
		<DLatchSection />
		<DFlipFlopSection />
		<ShiftRegisterSection />
		
		<LessonFooter 
			previousLesson="/lessons/inverted-logic-gates" 
			previousLessonTitle="Inverted Logic Gates"
		/>
	</div>
}

const SRLatchSection = () => {
  
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
	{ version === "block" && <SRLatchCircuit version="block" /> }
	{ version === "gates" && <SRLatchCircuit version="gates" /> }
  </div>
}

const DLatchSection = () => {
  
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
	{ version === "block" && <DLatchCircuit version="block" /> }
	{ version === "half-gates" && <DLatchCircuit version="half-gates" /> }
	{ version === "gates" && <DLatchCircuit version="gates" /> }
  </div>
}

const DFlipFlopSection = () => {
  
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
	{ version === "block" && <DFlipFlopCircuit version="block" /> }
	{ version === "half-gates" && <DFlipFlopCircuit version="half-gates" /> }
	{ version === "gates" && <DFlipFlopCircuit version="gates" /> }
  </div>
}

const ShiftRegisterSection = () => {
  
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
	{ version === "block" && <ShiftRegisterCircuit version="block" /> }
	{ version === "d-flip-flops" && <ShiftRegisterCircuit version="d-flip-flops" /> }
  </div>
}