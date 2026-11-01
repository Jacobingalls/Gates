import { LessonFooter } from "../../App/LessonFooter"

import { PedestrianCrossingSection } from "./PedestrianCrossing/Section"

export const TrafficLightsLesson = () => {
	return <div className="lesson">
		<h1>Traffic Lights</h1>
		
		<PedestrianCrossingSection />
		
		<LessonFooter
			previousLesson="/lessons/state-machines"
			previousLessonTitle="State Machines"
		/>
	</div>
}
