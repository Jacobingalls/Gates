import { LessonFooter } from "../../App/LessonFooter"

import { BasicStateMachineSection } from "./BasicStateMachine/Section"

export const StateMachineLesson = () => {
	return <div className="lesson">
		<h1>State Machines</h1>
		
		<BasicStateMachineSection />
		
		<LessonFooter
			previousLesson="/lessons/busses"
			previousLessonTitle="Busses"
		/>
	</div>
}