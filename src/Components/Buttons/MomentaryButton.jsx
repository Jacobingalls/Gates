import { useEffect } from "react";
import {useKeyPress} from "../../Hooks/useKeyPress"
import classNames from "classnames";

export const MomentaryButton = ({x, y, output, title, keyboard, position}) => {
  
  const btnPress = useKeyPress(keyboard)
  
  useEffect(() => {
	output(btnPress)
  }, [btnPress, output]);
  
  return <button 
	onMouseDown={() => {output(true);}}
	onMouseUp={() => {output(false);}}
	className={classNames({"pressed": btnPress})}
	style={{
	  "position": position || "absolute",
	  "top": `${y}px`,
	  "left": `${x}px`,
	}}
  >
	{title}
  </button>
}
