import "./Wires.css"

import classNames from "classnames";

export const Wire = ({path, on, color}) => {
  const style = color === undefined ? undefined : { stroke: color, strokeOpacity: on === true ? 1 : 0.3 }
  return <path className={classNames("wire", {"on": on === true})} d={path} style={style} />
}

// A placed connection point. A wire's is drawn solid so it doesn't brighten where
// it overlaps the translucent wire underneath.
export const Junction = ({x, y, on, color, bus}) => {
  const style = color === undefined ? undefined : { fill: color, fillOpacity: on === true || bus === true ? 1 : 0.3 }
  return <circle
    className={classNames("junction", {"on": on === true, "bus": bus === true})}
    cx={x} cy={y}
    r={bus === true ? 4.5 : 3.5}
    style={style}
  />
}

export const Bus = ({path, label, level, color}) => {
  
  var levelClass = undefined
  if (level !== undefined) {
    levelClass = "level-" + level
  }
  
  return <>
    <path className={classNames("bus", levelClass)} d={path} style={color === undefined ? undefined : { stroke: color }} />
    <path className="bus-annotation" d={
      `M${label.x},${label.y} m5,-10 l-10,20`
    } />
    <text x={label.x + 8} y={label.y - 12}>{label.wires}</text>
  </>
}

export const BusLabel = ({x, y, children, color, align}) => {
  return <text
    className="bus-label"
    x={x} y={y}
    text-anchor={align}
    style={color === undefined ? undefined : { fill: color }}
  >
    {children}
  </text>
}
