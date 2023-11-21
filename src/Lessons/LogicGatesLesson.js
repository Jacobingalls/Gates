import {useState} from "react";
import { SegmentedControl } from "../App/SegmentedControl"

import { ButtonCircuit } from "../Circuits/Basic/ButtonCircuit"
import { TwoInputGateCircuit, TwoInputTruthTableCircuit } from "../Circuits/Basic/TwoInputGateCircuits"
import { OrGate } from "../Components/Gates/OrGates"
import { AndGate } from "../Components/Gates/AndGates"
import { XorGate } from "../Components/Gates/XorGates"

import { LessonFooter } from "../App/LessonFooter"

export const LogicGatesLesson = () => {
	return <div className="lesson">
		<h1>Logic Gates</h1>
		<ButtonSection />
		<OrGateSection />
		<AndGateSection />
		<XorGateSection />
		
		<LessonFooter 
			nextLesson="/lessons/inverted-logic-gates"
			nextLessonTitle="Inverted Logic Gates"
		/>
	</div>
}

const ButtonSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Getting Started</h1>
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
	{ version === "diagram" && <ButtonCircuit version="diagram" /> }
	{ version === "table" && <ButtonCircuit version="table" /> }
  </div>
}

const OrGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Or Gate</h1>
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
	{ version === "diagram" && <TwoInputGateCircuit Gate={ OrGate } /> }
	{ version === "table" && <TwoInputTruthTableCircuit fn={(a, b) => { return a || b }} /> }
  </div>
}

const AndGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>And Gate</h1>
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
	{ version === "diagram" && <TwoInputGateCircuit Gate={ AndGate } /> }
	{ version === "table" && <TwoInputTruthTableCircuit fn={(a, b) => { return a && b }} /> }
  </div>
}

const XorGateSection = () => {
  
  const [version, setVersion] = useState("diagram");
  
  return <div className="section">
	<div className="header">
	  <h1>Xor Gate</h1>
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
	{ version === "diagram" && <TwoInputGateCircuit Gate={ XorGate } /> }
	{ version === "table" && <TwoInputTruthTableCircuit fn={(a, b) => { 
		return a !== b 
	}} /> }
  </div>
}