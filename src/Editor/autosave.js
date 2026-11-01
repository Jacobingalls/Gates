const STORAGE_KEY = "gates-editor-draft"
const TAB_KEY = "gates-editor-tab"

const keyFor = (kind) => kind === "circuit" ? STORAGE_KEY : `${STORAGE_KEY}-${kind}`

// Storage can be blocked or full, and an autosave isn't worth interrupting anyone for.
export const loadDraft = (kind, parse) => {
	try {
		const { circuit, fileName } = JSON.parse(localStorage.getItem(keyFor(kind)))
		return { doc: parse(circuit), fileName }
	} catch {
		return null
	}
}

export const saveDraft = (kind, doc, fileName) => {
	try {
		localStorage.setItem(keyFor(kind), JSON.stringify({ circuit: JSON.stringify(doc), fileName }))
	} catch {
		// Nothing to do: the page keeps working from memory.
	}
}

export const loadTab = () => {
	try {
		return localStorage.getItem(TAB_KEY)
	} catch {
		return null
	}
}

export const saveTab = (tab) => {
	try {
		localStorage.setItem(TAB_KEY, tab)
	} catch {
		// Nothing to do: the page keeps working from memory.
	}
}
