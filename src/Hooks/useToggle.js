import { useEffect, useState } from "react";

import { useKeyPress } from "./useKeyPress"

// Stays on or off between presses, and reports the change to `output`.
export const useToggle = (keyboard, output) => {
  const [on, setOn] = useState(false);
  const keyDown = useKeyPress(keyboard);
  
  useEffect(() => {
	if (keyDown) {
	  setOn((current) => !current)
	}
  }, [keyDown]);
  
  useEffect(() => {
	output(on)
  }, [on, output]);
  
  return [on, setOn]
}
