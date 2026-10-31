import { LessonFooter } from "../../App/LessonFooter"

import { BusIntroductionSection } from "./Sections/BusIntroductionSection"
import { BusLabelsSection } from "./Sections/BusLabelsSection"
import { BusTrafficLightSection } from "./Sections/BusTrafficLightSection"

export const BussesLesson = () => {
	return <div className="lesson">
		<h1>Busses</h1>
		
		<BusIntroductionSection />
		<BusLabelsSection />
		<BusTrafficLightSection />
		
		<LessonFooter
			previousLesson="/lessons/sequential-circuits"
			previousLessonTitle="Sequential Circuits"
			nextLesson="/lessons/state-machines"
			nextLessonTitle="State Machines"
		/>
	</div>
}