import "./Header.css"

import { Link } from "react-router-dom";

export const Header = () => {
	return <div className="app-header">
		<div className="header-wrapper">
			<h1><Link to="/">Gates</Link></h1>
		</div>
	</div>
}