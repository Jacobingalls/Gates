import {useState} from "react";

import { SRLatchSection } from "./SRLatch/Section"
import { DLatchSection } from "./DLatch/Section"
import { DFlipFlopSection } from "./DFlipFlop/Section"
import { ShiftRegisterSection } from "./ShiftRegister/Section"

import { LessonFooter } from "../../App/LessonFooter"

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
			nextLesson="/lessons/busses"
			nextLessonTitle="Busses"
		/>
	</div>
}



