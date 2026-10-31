import { LessonFooter } from "../../App/LessonFooter"

import { NotGateSection } from "./Sections/NotGateSection"
import { NorGateSection } from "./Sections/NorGateSection"
import { NandGateSection } from "./Sections/NandGateSection"
import { XnorGateSection } from "./Sections/XnorGateSection"

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



