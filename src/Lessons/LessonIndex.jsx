import "./LessonIndex.css"

import { Link } from "react-router-dom";

import { LESSONS } from "./lessons"

export const LessonIndex = () => {
	return <div className="lesson">
		<h1>Lessons</h1>
		
		<ol className="lesson-index">
			{LESSONS.map(({ path, title }) => <li key={path}><Link to={path}>{title}</Link></li>)}
		</ol>
	</div>
}
