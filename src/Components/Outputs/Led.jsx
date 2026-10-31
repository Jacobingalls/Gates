import "./Led.css"

import classNames from "classnames";

const customStyle = (color, on) => {
  if (on === true) {
    return { fill: color, stroke: color }
  }
  return { fill: color, fillOpacity: 0.2, stroke: color, strokeOpacity: 0.4 }
}

export const Led = ({x, y, on, color}) => {
  const custom = color !== undefined && color.startsWith("#")
  
  return <circle
	className={classNames("led", custom ? undefined : color, {"on": on === true})}
	cx={x}
	cy={y}
	r="10"
	style={custom ? customStyle(color, on) : undefined}
  />
}
