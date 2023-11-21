import { MomentaryButton } from "./MomentaryButton";

export const KeyboardButton = ({x, y, output, keyboard, position}) => {
  return <MomentaryButton 
	x={x} y={y} output={output}
	title={keyboard} keyboard={keyboard} position={position}
  />
}
