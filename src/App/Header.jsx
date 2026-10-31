import "./Header.css"

import classNames from "classnames";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
	const { pathname } = useLocation();
	
	return <div className={classNames("app-header", { thin: pathname.startsWith("/editor") })}>
		<div className="header-wrapper">
			<h1><Link to="/">Gates</Link></h1>
			<nav className="header-links">
				<Link to="/">Lessons</Link>
				<Link to="/editor">Editor</Link>
			</nav>
		</div>
	</div>
}