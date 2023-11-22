import {useState} from "react";

import { SegmentedControl } from "../App/SegmentedControl"

import { NotGateCircuit } from "../Circuits/Basic/NotGateCircuit"
import { TwoInputGateCircuit, TwoInputTruthTableCircuit } from "../Circuits/Basic/TwoInputGateCircuits"
import { NorGate } from "../Components/Gates/OrGates"
import { NandGate } from "../Components/Gates/AndGates"
import { XnorGate } from "../Components/Gates/XorGates"
import { XorCircuit } from "../Circuits/Basic/XorCircuit"

import { LessonFooter } from "../App/LessonFooter"

export const InvertedLogicGatesLesson = () => {
	return <div className="lesson">
		<h1>Inverted Gates</h1>
		
		<NotGateSection />
		<NorGateSection />
		<NandGateSection />
		<XnorGateSection />
		
		<LessonFooter 
			previousLesson="/lessons/logic-gates" 
			previousLessonTitle="Logic Gates" 
			nextLesson="/lessons/sequential-circuits"
			nextLessonTitle="Sequential Circuits"
		/>
	</div>
}

const NotGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Not Gate</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["diagram", "table"]} 
		  titles={["Diagram", "Truth Table"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "diagram" && <NotGateCircuit version="diagram" /> }
	{ version === "table" && <NotGateCircuit version="table" /> }
  </div>
}

const NorGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Nor Gate</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["diagram", "table"]} 
		  titles={["Diagram", "Truth Table"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "diagram" && <TwoInputGateCircuit Gate={ NorGate } /> }
	{ version === "table" && <TwoInputTruthTableCircuit fn={(a, b) => { return !(a || b) }} /> }
  </div>
}

const NandGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Nand Gate</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["diagram", "table"]} 
		  titles={["Diagram", "Truth Table"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "diagram" && <TwoInputGateCircuit Gate={ NandGate } /> }
	{ version === "table" && <TwoInputTruthTableCircuit fn={(a, b) => { return !(a && b) }} /> }
  </div>
}

const XnorGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Xnor Gate</h1>
	  <div>
		View as:&nbsp;
		<SegmentedControl 
		  values={["diagram", "gates", "table"]} 
		  titles={["Diagram", "As Gates", "Truth Table"]}
		  value={version}
		  setValue={setVersion}
		/>
	  </div>
	</div>
	{ version === "diagram" && <TwoInputGateCircuit Gate={ XnorGate } /> }
	{ version === "gates" && <XorCircuit inverted={true} /> }
	{ version === "table" && <TwoInputTruthTableCircuit fn={(a, b) => { 
		return a === b 
	}} /> }
  </div>
}