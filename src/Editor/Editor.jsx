import "./Editor.css"

import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import { CircuitDiagram } from "../Circuits/CircuitDiagram"
import { StateMachineDiagram } from "../Circuits/StateMachineDiagram"
import { TruthTableDiagram } from "../Circuits/TruthTableDiagram"
import { Canvas } from "./Canvas"
import { Inspector } from "./Inspector"
import { Library } from "./Library"
import { loadTab, saveTab } from "./autosave"
import { KINDS, exportDocument, parseDocument } from "./documents"
import { useDocument } from "./useDocument"
import { useWindowEvent } from "./useWindowEvent"
import {
	allItems, copyItems, finishedCircuit, fitFrame, flipSelection, isEmptyCopy, pasteItems, removeSelection,
	rotateSelection,
} from "./circuit"

const TOOLS = {
	circuit: [
		{ id: "select", title: "Select", key: "v" },
		{ id: "wire", title: "Wire", key: "w" },
		{ id: "bus", title: "Bus", key: "b" },
		{ id: "point", title: "Point", key: "p" },
	],
	truthTable: [{ id: "select", title: "Select", key: "v" }],
	stateMachine: [
		{ id: "select", title: "Select", key: "v" },
		{ id: "state", title: "State", key: "s" },
		{ id: "transition", title: "Transition", key: "t" },
	],
}

const RUNNERS = {
	circuit: (doc) => <CircuitDiagram circuit={doc} />,
	truthTable: (doc) => <TruthTableDiagram table={doc} />,
	stateMachine: (doc) => <StateMachineDiagram machine={doc} />,
}

const REVOKE_DELAY = 10000
const PASTE_OFFSET = 20
const FILE_TYPES = [{ description: "Gates diagram", accept: { "application/json": [".json"] } }]

// A ticked checkbox keeps focus, and shouldn't take the editor's shortcuts with it.
const isTyping = (element) => ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) && element.type !== "checkbox"

export const Editor = () => {
	const documents = {
		circuit: useDocument("circuit"),
		truthTable: useDocument("truthTable"),
		stateMachine: useDocument("stateMachine"),
	}
	
	const [tab, setTab] = useState(() => KINDS[loadTab()] === undefined ? "circuit" : loadTab());
	const history = documents[tab];
	const { apply, undo, redo, fileName, setFileName } = history;
	const { doc } = history;
	
	const [selection, setSelection] = useState([]);
	const [tool, setTool] = useState("select");
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
		saveTab(tab)
	}, [tab]);
	
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
			const match = TOOLS[tab].find((candidate) => candidate.key === key)
			if (match !== undefined) {
				setTool(match.id)
			}
		}
	});
	
	const start = (next, name) => {
		documents[next.kind].reset(next)
		documents[next.kind].setFileName(name)
		setTab(next.kind)
		setSelection([])
		setTool("select")
		setScrollKey((key) => key + 1)
	}
	
	const switchTab = (kind) => {
		setTab(kind)
		setSelection([])
		setTool("select")
		setStatus("")
	}
	
	const toggleRun = (event) => {
		setRunning(isRunning ? null : { kind: tab, doc: finishedCircuit(doc) })
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
			start(parseDocument(await file.text()), file.name)
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
		const text = exportDocument(doc)
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
	
	const runView = isRunning && <div className="editor-run">
		{RUNNERS[running.kind](running.doc)}
	</div>
	
	return <div className="editor">
		<div className="editor-toolbar">
			<span className="editor-tabs">
				{Object.entries(KINDS).map(([kind, { title }]) => {
					return <button
						key={kind}
						type="button"
						disabled={isRunning}
						className={classNames({ current: tab === kind })}
						onClick={() => switchTab(kind)}
					>
						{title}
					</button>
				})}
			</span>
			
			<span className="editor-divider" />
			
			<button type="button" disabled={isRunning} onClick={() => {
				start(KINDS[tab].blank(), KINDS[tab].fileName)
				setStatus("")
			}}>New</button>
			<button type="button" disabled={isRunning} onClick={() => fileRef.current.click()}>Open</button>
			<button type="button" onClick={save}>Save</button>
			<input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
			
			{TOOLS[tab].length > 0 && <span className="editor-divider" />}
			
			{TOOLS[tab].map(({ id, title, key }) => {
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
				title="Fit the box around everything (F)"
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
			<Library kind={tab} locked={isRunning} />
			<div className="editor-stage">
				<Canvas
					key={tab}
					history={history}
					selection={selection}
					setSelection={setSelection}
					tool={tool}
					setTool={setTool}
					setStatus={setStatus}
					scrollKey={scrollKey}
					locked={isRunning}
				/>
				{runView}
			</div>
			<Inspector
				doc={doc}
				selection={selection}
				setSelection={setSelection}
				apply={apply}
				clearSelection={() => setSelection([])}
				onDuplicate={duplicate}
				onZoom={(circuit) => setRunning({ kind: "circuit", doc: circuit })}
				locked={isRunning}
			/>
		</div>
	</div>
}
