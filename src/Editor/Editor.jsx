import "./Editor.css"

import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import { CircuitDiagram } from "../Circuits/CircuitDiagram"
import { Canvas } from "./Canvas"
import { Inspector } from "./Inspector"
import { Library } from "./Library"
import { loadDraft, saveDraft } from "./autosave"
import { useHistory } from "./useHistory"
import { useWindowEvent } from "./useWindowEvent"
import {
	allItems, blankCircuit, copyItems, exportCircuit, finishedCircuit, fitFrame, flipSelection, isEmptyCopy,
	parseCircuit, pasteItems, removeSelection, rotateSelection,
} from "./circuit"

const TOOLS = [
	{ id: "select", title: "Select", key: "v" },
	{ id: "wire", title: "Wire", key: "w" },
	{ id: "bus", title: "Bus", key: "b" },
	{ id: "point", title: "Point", key: "p" },
]

const REVOKE_DELAY = 10000
const PASTE_OFFSET = 20
const FILE_TYPES = [{ description: "Circuit", accept: { "application/json": [".json"] } }]

const isTyping = (element) => ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)

export const Editor = () => {
	const [draft] = useState(loadDraft);
	const history = useHistory(draft?.doc ?? blankCircuit());
	const { doc, apply, undo, redo, reset } = history;
	
	const [selection, setSelection] = useState([]);
	const [tool, setTool] = useState("select");
	const [fileName, setFileName] = useState(draft?.fileName ?? "Circuit.json");
	const [status, setStatus] = useState("");
	const [scrollKey, setScrollKey] = useState(0);
	const [running, setRunning] = useState(null);
	const fileRef = useRef(null);
	
	const isRunning = running !== null
	const copyRef = useRef(null);
	
	const addCopy = (copy, steps) => {
		const offset = PASTE_OFFSET * steps
		const pasted = pasteItems(doc, copy, [offset, offset])
		apply(() => pasted.doc)
		setSelection(pasted.selection)
	}
	
	const copySelection = () => {
		const items = copyItems(doc, selection)
		if (!isEmptyCopy(items)) {
			copyRef.current = { items, pastes: 0 }
		}
		return !isEmptyCopy(items)
	}
	
	const paste = () => {
		if (copyRef.current !== null) {
			copyRef.current.pastes += 1
			addCopy(copyRef.current.items, copyRef.current.pastes)
		}
	}
	
	const duplicate = () => {
		const items = copyItems(doc, selection)
		if (!isEmptyCopy(items)) {
			addCopy(items, 1)
		}
	}
	
	useEffect(() => {
		saveDraft(doc, fileName)
	}, [doc, fileName]);
	
	useWindowEvent("keydown", (event) => {
		if (isRunning) {
			// The keyboard belongs to the circuit's buttons while it runs.
			if (event.key === "Escape") {
				setRunning(null)
			}
			return
		}
		
		if (isTyping(event.target)) {
			return
		}
		
		const key = event.key.toLowerCase()
		if ((event.metaKey || event.ctrlKey) && key === "z") {
			event.preventDefault()
			event.shiftKey ? redo() : undo()
			setSelection([])
		} else if ((event.metaKey || event.ctrlKey) && key === "a") {
			event.preventDefault()
			setSelection(allItems(doc))
		} else if ((event.metaKey || event.ctrlKey) && key === "c") {
			// Left to the browser, these find no text to act on, and macOS beeps.
			event.preventDefault()
			copySelection()
		} else if ((event.metaKey || event.ctrlKey) && key === "x") {
			event.preventDefault()
			if (copySelection()) {
				apply((current) => removeSelection(current, selection))
				setSelection([])
			}
		} else if ((event.metaKey || event.ctrlKey) && key === "v") {
			event.preventDefault()
			paste()
		} else if ((event.metaKey || event.ctrlKey) && key === "d") {
			event.preventDefault()
			duplicate()
		} else if (event.metaKey || event.ctrlKey) {
			return
		} else if ((event.key === "Delete" || event.key === "Backspace") && selection.length > 0) {
			event.preventDefault()
			apply((current) => removeSelection(current, selection))
			setSelection([])
		} else if (event.key === "Escape") {
			setSelection([])
		} else if (key === "f") {
			apply(fitFrame)
		} else if (key === "r") {
			apply((current) => rotateSelection(current, selection))
		} else if (key === "x") {
			apply((current) => flipSelection(current, selection, "flipX"))
		} else if (key === "y") {
			apply((current) => flipSelection(current, selection, "flipY"))
		} else {
			const match = TOOLS.find((candidate) => candidate.key === key)
			if (match !== undefined) {
				setTool(match.id)
			}
		}
	});
	
	const start = (circuit, name) => {
		reset(circuit)
		setFileName(name)
		setSelection([])
		setTool("select")
		setScrollKey((key) => key + 1)
	}
	
	const toggleRun = (event) => {
		setRunning(isRunning ? null : finishedCircuit(doc))
		// A focused button would be pressed again by the space bar.
		event.currentTarget.blur()
	}
	
	const onFile = async (event) => {
		const file = event.target.files[0]
		event.target.value = ""
		if (file === undefined) {
			return
		}
		
		try {
			start(parseCircuit(await file.text()), file.name)
			setStatus(`Opened ${file.name}`)
		} catch (error) {
			setStatus(`Couldn't open ${file.name}: ${error.message}`)
		}
	}
	
	const download = (text) => {
		const url = URL.createObjectURL(new Blob([text], { type: "application/json" }))
		const link = document.createElement("a")
		link.href = url
		link.download = fileName
		link.click()
		// The browser reads the URL after this returns, so it has to outlive the click.
		setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY)
		setStatus(`Downloaded ${fileName}`)
	}
	
	// Only Chromium browsers can show a real save panel, so the rest download.
	const save = async () => {
		const text = exportCircuit(doc)
		if (window.showSaveFilePicker === undefined) {
			download(text)
			return
		}
		
		try {
			const handle = await window.showSaveFilePicker({ suggestedName: fileName, types: FILE_TYPES })
			const writable = await handle.createWritable()
			await writable.write(text)
			await writable.close()
			setFileName(handle.name)
			setStatus(`Saved ${handle.name}`)
		} catch (error) {
			if (error.name !== "AbortError") {
				setStatus(`Couldn't save: ${error.message}`)
			}
		}
	}
	
	return <div className="editor">
		<div className="editor-toolbar">
			<button type="button" disabled={isRunning} onClick={() => {
				start(blankCircuit(), "Circuit.json")
				setStatus("")
			}}>New</button>
			<button type="button" disabled={isRunning} onClick={() => fileRef.current.click()}>Open</button>
			<button type="button" onClick={save}>Save</button>
			<input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
			
			<span className="editor-divider" />
			
			{TOOLS.map(({ id, title, key }) => {
				return <button
					key={id}
					type="button"
					disabled={isRunning}
					title={`${title} (${key.toUpperCase()})`}
					className={classNames({ active: tool === id })}
					onClick={() => setTool(id)}
				>
					{title}
				</button>
			})}
			
			<span className="editor-divider" />
			
			<button type="button" disabled={isRunning} onClick={undo}>Undo</button>
			<button type="button" disabled={isRunning} onClick={redo}>Redo</button>
			
			<button
				type="button"
				disabled={isRunning}
				title="Fit the circuit box around everything (F)"
				onClick={() => apply(fitFrame)}
			>
				Fit Box
			</button>
			
			<span className="editor-divider" />
			
			<button
				type="button"
				title={isRunning ? "Stop (Esc)" : "Run"}
				className={classNames("editor-run-toggle", { active: isRunning })}
				onClick={toggleRun}
			>
				{isRunning ? "Stop" : "Run"}
			</button>
			
			<span className="editor-file">{fileName}</span>
			<span className="editor-status" role="status">{status}</span>
		</div>
		
		<div className="editor-body">
			<Library locked={isRunning} />
			<div className="editor-stage">
				<Canvas
					history={history}
					selection={selection}
					setSelection={setSelection}
					tool={tool}
					setTool={setTool}
					setStatus={setStatus}
					scrollKey={scrollKey}
					locked={isRunning}
				/>
				{isRunning && <div className="editor-run">
					<CircuitDiagram circuit={running} />
				</div>}
			</div>
			<Inspector
				doc={doc}
				selection={selection}
				apply={apply}
				clearSelection={() => setSelection([])}
				onDuplicate={duplicate}
				locked={isRunning}
			/>
		</div>
	</div>
}
