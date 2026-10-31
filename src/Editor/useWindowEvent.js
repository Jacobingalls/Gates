import { useEffect, useRef } from "react";

// Keeps one listener for the life of the component. Resubscribing on each render
// isn't safe: a handler that sets state re-renders straight away, and the browser
// skips any listener swapped while it's still delivering that event.
export const useWindowEvent = (type, handler) => {
	const latest = useRef(handler);
	latest.current = handler;
	
	useEffect(() => {
		const listener = (event) => latest.current(event)
		window.addEventListener(type, listener)
		return () => window.removeEventListener(type, listener)
	}, [type]);
}
