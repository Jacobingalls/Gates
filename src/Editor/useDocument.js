import { useEffect, useState } from "react";

import { KINDS } from "./documents"
import { loadDraft, saveDraft } from "./autosave"
import { useHistory } from "./useHistory"

// One open file: its contents, undo history, name and autosave.
export const useDocument = (kind) => {
	const [draft] = useState(() => loadDraft(kind, KINDS[kind].parse));
	const history = useHistory(draft?.doc ?? KINDS[kind].blank());
	const [fileName, setFileName] = useState(draft?.fileName ?? KINDS[kind].fileName);
	
	useEffect(() => {
		saveDraft(kind, history.doc, fileName)
	}, [kind, history.doc, fileName]);
	
	return { ...history, fileName, setFileName }
}
