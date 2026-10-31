import {useState} from "react";

import { SegmentedControl } from "../../../App/SegmentedControl"

import { TwoInputGateCircuit, TwoInputTruthTableCircuit } from "../../../Circuits/TwoInputGateCircuits"

import { XnorGate } from "../../../Components/Gates/XorGates"
import { NotGate } from "../../../Components/Gates/NotGates"
import { AndGate } from "../../../Components/Gates/AndGates"
import { OrGate, NorGate } from "../../../Components/Gates/OrGates"
import { Wire } from "../../../Components/Wires"
import { Led } from "../../../Components/Outputs/Led"
import { KeyboardButton } from "../../../Components/Buttons/KeyboardButton.js"

import { Circuit, CircuitSVG } from "../../../Circuits/Circuit"
import { TruthTable, TruthTableRow, TruthTableHeader, TruthTableCell } from "../../../Circuits/TruthTable"

import { XorCircuit } from "../../LogicGatesLesson/Sections/XorGateSection"

export const XnorGateSection = () => {
  
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