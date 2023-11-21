import "./LessonFooter.css"
import classNames from "classnames";

import { Link } from "react-router-dom";

export const LessonFooter = ({previousLesson, previousLessonTitle, nextLesson, nextLessonTitle}) => {
	
	var previous = <div></div>
	if (previousLesson !== undefined) {
		previous = <ArrowLink to={previousLesson}>{previousLessonTitle}</ArrowLink>
	}
	
	var next = <div></div>
	if (nextLesson !== undefined) {
		next = <ArrowLink to={nextLesson} right={true}>{nextLessonTitle}</ArrowLink>
	}
	
	return <div className="lesson-footer">
		{previous}
		{next}
	</div>
}

export const ArrowLink = ({ to, children, right }) => {
	return <Link className={classNames("arrow", {right: right})}
	  to={to}
	>
	  {children}
	</Link>
}