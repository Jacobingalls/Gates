import { parseCircuit } from "./circuit"

const STORAGE_KEY = "gates-editor-draft"

// Storage can be blocked or full, and an autosave isn't worth interrupting anyone for.
export const loadDraft = () => {
	try {
		const { circuit, fileName } = JSON.parse(localStorage.getItem(STORAGE_KEY))
		return { doc: parseCircuit(circuit), fileName }
	} catch {
		return null
	}
}

export const saveDraft = (doc, fileName) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ circuit: JSON.stringify(doc), fileName }))
	} catch {
		// Nothing to do: the page keeps working from memory.
	}
}
