import classNames from "classnames";

export const Led = ({x, y, on}) => {
  return <circle
	className={classNames("led", {"on": on === true})}
	cx={x}
	cy={y}
	r="10"
  />
}