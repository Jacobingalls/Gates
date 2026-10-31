import "./Wires.css"

import classNames from "classnames";

export const Wire = ({path, on}) => {
  return <path className={classNames("wire", {"on": on === true})} d={path} />
}

export const Bus = ({path, label, level}) => {
  
  var levelClass = undefined
  if (level !== undefined) {
    levelClass = "level-" + level
  }
  
  return <>
    <path className={classNames("bus", levelClass)} d={path} />
    <path className="bus-annotation" d={
      `M${label.x},${label.y} m5,-10 l-10,20`
    } />
    <text x={label.x + 8} y={label.y - 12}>{label.wires}</text>
  </>
}

export const BusLabel = ({x, y, children}) => {
  return <text className="bus-label" x={x} y={y}>{children}</text>
}