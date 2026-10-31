import { LessonFooter } from "../../App/LessonFooter"

import { BusIntroductionSection } from "./Introduction/Section"
import { BusLabelsSection } from "./Labels/Section"
import { BusTrafficLightSection } from "./TrafficLight/Section"

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