import { LessonFooter } from "../../App/LessonFooter"

import { NotGateSection } from "./NotGate/Section"
import { NorGateSection } from "./NorGate/Section"
import { NandGateSection } from "./NandGate/Section"
import { XnorGateSection } from "./XnorGate/Section"

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



