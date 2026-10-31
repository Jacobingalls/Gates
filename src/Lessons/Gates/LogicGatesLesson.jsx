import {useState} from "react";

import { LessonFooter } from "../../App/LessonFooter"

import { ButtonSection } from "./Button/Section"
import { OrGateSection } from "./OrGate/Section"
import { AndGateSection } from "./AndGate/Section"
import { XorGateSection } from "./XorGate/Section"

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



