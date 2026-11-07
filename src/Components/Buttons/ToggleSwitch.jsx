import { useToggle } from "../../Hooks/useToggle"

export const ToggleSwitch = ({x, y, output, keyboard}) => {
  const [on, setOn] = useToggle(keyboard, output);
  
  return <label className="switch" style={{
	"position": "absolute",
	"top": `${y}px`,
	"left": `${x}px`,
  }}>
	<div className="gradient"></div>
	<input
	  type="checkbox"
	  checked={on}
	  onChange={(event) => setOn(event.target.checked)}
	/>
	<div className="slider">
	  <div className="gradient"></div>
	  <div className="key">{keyboard}</div>
	</div>
  </label>
}
