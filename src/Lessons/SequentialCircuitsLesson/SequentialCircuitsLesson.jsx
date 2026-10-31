import {useState} from "react";

import { SRLatchSection } from "./Sections/SRLatchSection"
import { DLatchSection } from "./Sections/DLatchSection"
import { DFlipFlopSection } from "./Sections/DFlipFlopSection"
import { ShiftRegisterSection } from "./Sections/ShiftRegisterSection"

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



