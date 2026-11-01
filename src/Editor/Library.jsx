import { useState } from "react";

import { PARTS } from "../Circuits/parts"
import { PartIcon } from "./PartIcon"

export const LABEL_ITEM = "Label"
export const STATE_ITEM = "State"
export const BACKDROP_ITEM = "Backdrop"
export const DRAG_TYPE = "application/x-gates-part"

const ITEMS = [
	...Object.entries(PARTS).map(([name, part]) => ({
		name, title: part.title, category: part.category, keywords: part.keywords, icon: part.icon ?? "chip",
	})),
	{ name: LABEL_ITEM, title: "Text Label", category: "Annotations", keywords: "text annotation name", icon: "text" },
	{ name: BACKDROP_ITEM, title: "Backdrop", category: "Annotations", keywords: "rounded rectangle group panel layer background", icon: "backdrop" },
]

const STATE = { name: STATE_ITEM, title: "State", category: "State Machine", keywords: "node", icon: "state" }

const TABLE_CATEGORIES = ["Inputs & Outputs", "Timing", "Annotations"]
const MACHINE_CATEGORIES = [...TABLE_CATEGORIES, "Math", "Memory"]

// Tables only place what connects to their inputs and outputs, and machines add what can
// work out values for them. Neither uses gates, since the logic is the table or machine.
const itemsFor = (kind) => {
	if (kind === "circuit") {
		return ITEMS
	}
	const allowed = kind === "stateMachine" ? MACHINE_CATEGORIES : TABLE_CATEGORIES
	const devices = ITEMS.filter((item) => allowed.includes(item.category))
	return kind === "stateMachine" ? [STATE, ...devices] : devices
}

export const Library = ({ kind, locked }) => {
	const [search, setSearch] = useState("");
	
	const query = search.trim().toLowerCase()
	const items = itemsFor(kind)
	const categories = [...new Set(items.map((item) => item.category))]
	const matches = items.filter(({ title, category, keywords }) => {
		return `${title} ${category} ${keywords}`.toLowerCase().includes(query)
	})
	
	return <div className="editor-panel editor-library" inert={locked ? "" : undefined}>
		<div className="editor-library-search">
			<input
				type="search"
				placeholder="Search components"
				aria-label="Search components"
				value={search}
				onChange={(event) => setSearch(event.target.value)}
			/>
		</div>
		
		{categories.map((category) => {
			const shown = matches.filter((item) => item.category === category)
			return shown.length > 0 && <div key={category}>
				<h2>{category}</h2>
				{shown.map(({ name, title, icon }) => {
					return <div
						key={name}
						className="editor-library-item"
						draggable
						onDragStart={(event) => event.dataTransfer.setData(DRAG_TYPE, name)}
					>
						<PartIcon name={name} icon={icon} />
						{title}
					</div>
				})}
			</div>
		})}
		
		{matches.length === 0 && <p>No components match.</p>}
	</div>
}
