import { PARTS, stubOf, stubPath } from "../Circuits/parts"

const noop = () => {}

const ChipIcon = () => <>
	<path className="editor-icon-line" d="M2,7 h3 M2,12 h3 M2,17 h3 M19,7 h3 M19,12 h3 M19,17 h3" />
	<rect className="editor-icon-body" x="5" y="3" width="14" height="18" rx="2" />
</>

const ButtonIcon = () => <>
	<path className="editor-icon-line" d="M20,13 h4" />
	<rect className="editor-icon-body" x="3" y="8" width="18" height="11" rx="3" />
	<rect className="editor-icon-body" x="6" y="5" width="12" height="9" rx="2" />
</>

const LightIcon = () => <>
	<path className="editor-icon-line" d="M0,12 h6" />
	<circle className="editor-icon-body" cx="13" cy="12" r="8" />
</>

const TrafficLightIcon = () => <>
	<path className="bus-stub editor-icon-bus" d="M1,12 h6" />
	<rect className="editor-icon-body" x="7" y="2" width="10" height="20" rx="3" />
	<circle className="editor-icon-red" cx="12" cy="7" r="1.8" />
	<circle className="editor-icon-yellow" cx="12" cy="12" r="1.8" />
	<circle className="editor-icon-green" cx="12" cy="17" r="1.8" />
</>

const TextIcon = () => <path className="editor-icon-line" d="M5,7 V5 H19 V7 M12,5 V19 M9,19 H15" />

const DRAWN_ICONS = {
	chip: ChipIcon, button: ButtonIcon, light: LightIcon, trafficLight: TrafficLightIcon, text: TextIcon,
}

// Gates draw themselves, so the library can't drift from what lands on the canvas.
const GateIcon = ({ name }) => {
	const part = PARTS[name]
	const { Component } = part
	
	return <svg className="editor-icon" viewBox="-9 -9 68 68" aria-hidden="true">
		{Object.entries(part.pins).map(([prop, pin]) => {
			return <path key={prop} className="gate-line" d={stubPath(stubOf(part, pin))} />
		})}
		<Component x={0} y={0} output={noop} />
	</svg>
}

export const PartIcon = ({ name, icon }) => {
	if (icon === "gate") {
		return <GateIcon name={name} />
	}
	
	const Drawn = DRAWN_ICONS[icon]
	return <svg className="editor-icon" viewBox="0 0 24 24" aria-hidden="true">
		<Drawn />
	</svg>
}
