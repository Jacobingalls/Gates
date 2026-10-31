import { useState } from "react";

import { PARTS } from "../Circuits/parts"
import { PartIcon } from "./PartIcon"

export const LABEL_ITEM = "Label"
export const DRAG_TYPE = "application/x-gates-part"

const ITEMS = [
	...Object.entries(PARTS).map(([name, part]) => ({
		name, title: part.title, category: part.category, keywords: part.keywords, icon: part.icon ?? "chip",
	})),
	{ name: LABEL_ITEM, title: "Text Label", category: "Inputs & Outputs", keywords: "text annotation name", icon: "text" },
]

const CATEGORIES = [...new Set(ITEMS.map((item) => item.category))]

export const Library = ({ locked }) => {
	const [search, setSearch] = useState("");
	
	const query = search.trim().toLowerCase()
	const matches = ITEMS.filter(({ title, category, keywords }) => {
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
		
		{CATEGORIES.map((category) => {
			const items = matches.filter((item) => item.category === category)
			return items.length > 0 && <div key={category}>
				<h2>{category}</h2>
				{items.map(({ name, title, icon }) => {
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
