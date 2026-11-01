import classNames from "classnames";

import { useToggle } from "../../Hooks/useToggle"

export const RockerSwitch = ({x, y, output, keyboard}) => {
  const [on, setOn] = useToggle(keyboard, output);
  
  return <button
	type="button"
	aria-pressed={on}
	onClick={() => setOn((current) => !current)}
	className={classNames("rocker", {"on": on})}
	style={{
	  "position": "absolute",
	  "top": `${y}px`,
	  "left": `${x}px`,
	}}
  >
	{keyboard}
  </button>
}
