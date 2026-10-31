import { useCallback, useState } from "react";

const LIMIT = 100

export const useHistory = (initial) => {
	const [state, setState] = useState({ doc: initial, past: [], future: [] });
	
	const pushed = (current) => [...current.past, current.doc].slice(-LIMIT)
	
	const apply = useCallback((change) => setState((current) => ({
		doc: change(current.doc), past: pushed(current), future: [],
	})), []);
	
	// A drag saves one undo step when it starts, then previews every move.
	const begin = useCallback(() => setState((current) => ({
		...current, past: pushed(current), future: [],
	})), []);
	
	const preview = useCallback((change) => setState((current) => ({
		...current, doc: change(current.doc),
	})), []);
	
	const undo = useCallback(() => setState((current) => {
		if (current.past.length === 0) {
			return current
		}
		return {
			doc: current.past[current.past.length - 1],
			past: current.past.slice(0, -1),
			future: [current.doc, ...current.future],
		}
	}), []);
	
	const redo = useCallback(() => setState((current) => {
		if (current.future.length === 0) {
			return current
		}
		return { doc: current.future[0], past: [...current.past, current.doc], future: current.future.slice(1) }
	}), []);
	
	const reset = useCallback((doc) => setState({ doc, past: [], future: [] }), []);
	
	return { doc: state.doc, apply, begin, preview, undo, redo, reset }
}
