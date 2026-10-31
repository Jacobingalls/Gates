import "./Led.css"

import classNames from "classnames";

export const Led = ({x, y, on, color}) => {
  return <circle
	className={classNames("led", color, {"on": on === true})}
	cx={x}
	cy={y}
	r="10"
  />
}