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

const WalkLightIcon = () => <>
	<path className="editor-icon-line" d="M0,12 h4" />
	<rect className="editor-icon-body" x="4" y="4" width="18" height="16" rx="3" />
	<rect className="editor-icon-yellow" x="7" y="9" width="5" height="7" rx="1" />
	<path className="editor-icon-yellow" d="M15,8 h4 v8 h-4 v-1.5 h2.5 v-2 h-2.5 v-1.5 h2.5 v-1.5 h-2.5 z" />
</>

const SpeakerIcon = () => <>
	<path className="editor-icon-line" d="M0,12 h4" />
	<path className="editor-icon-body" d="M5,9 h4 l6,-5 v16 l-6,-5 h-4 z" />
	<path className="editor-icon-line" d="M18,9 a4,4 0 0,1 0,6" />
</>

const SwitchIcon = () => <>
	<path className="editor-icon-line" d="M20,12 h4" />
	<rect className="editor-icon-body" x="1" y="7" width="20" height="10" rx="2" />
	<rect className="editor-icon-line" x="11" y="9" width="8" height="6" rx="1" />
</>

const SevenSegmentIcon = () => <>
	<path className="editor-icon-line" d="M1,12 h4" />
	<rect className="editor-icon-body" x="5" y="2" width="15" height="20" rx="2" />
	<path className="editor-icon-line" d="M9,6 h7 v12 h-7 Z M9,12 h7" />
</>

const ClockIcon = () => <>
	<path className="editor-icon-line" d="M20,12 h4" />
	<rect className="editor-icon-body" x="2" y="4" width="18" height="16" rx="2" />
	<path className="editor-icon-line" d="M5,15 h3 v-6 h3 v6 h3 v-6 h3" />
</>

const StateIcon = () => <>
	<circle className="editor-icon-body" cx="12" cy="12" r="9" />
	<circle className="editor-icon-line" cx="12" cy="12" r="5" />
</>

const TextIcon = () => <path className="editor-icon-line" d="M5,7 V5 H19 V7 M12,5 V19 M9,19 H15" />

const BackdropIcon = () => <rect className="editor-icon-body" x="3" y="5" width="18" height="14" rx="4" />

const MuxIcon = () => <>
	<path className="editor-icon-line" d="M2,8 h5 M2,16 h5 M17,12 h5" />
	<path className="editor-icon-body" d="M7,3 L17,7 V17 L7,21 Z" />
</>

const DemuxIcon = () => <>
	<path className="editor-icon-line" d="M2,12 h5 M17,8 h5 M17,16 h5" />
	<path className="editor-icon-body" d="M7,7 L17,3 V21 L7,17 Z" />
</>

const DRAWN_ICONS = {
	backdrop: BackdropIcon, chip: ChipIcon, mux: MuxIcon, demux: DemuxIcon, button: ButtonIcon, light: LightIcon, trafficLight: TrafficLightIcon, text: TextIcon,
	walkLight: WalkLightIcon, speaker: SpeakerIcon,
	switch: SwitchIcon, clock: ClockIcon, sevenSegment: SevenSegmentIcon, state: StateIcon,
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
