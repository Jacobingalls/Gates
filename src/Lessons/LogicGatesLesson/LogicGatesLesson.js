import {useState} from "react";

import { LessonFooter } from "../../App/LessonFooter"

import { ButtonSection } from "./Sections/ButtonSection"
import { OrGateSection } from "./Sections/OrGateSection"
import { AndGateSection } from "./Sections/AndGateSection"
import { XorGateSection } from "./Sections/XorGateSection"

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



