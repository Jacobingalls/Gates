import "./SoundToggle.css"

import classNames from "classnames";

import { NO_SOUND, SOUND_MODULES, useSoundModule } from "../Sounds/soundModules"

const SIZE = 20

const Glyph = ({ on }) => <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
	<path className="sound-cone" d="M3,8 v4 h3 l4,3.5 v-11 l-4,3.5 z" />
	<path d={on ? "M13,7.5 a4,4 0 0,1 0,5 M15.5,5 a8,8 0 0,1 0,10" : "M13,7.5 l5,5 M18,7.5 l-5,5"} />
</svg>

// Turns sound on or off for this module. Only one module sounds at a time, so turning it on
// here takes it from whichever had it, and the tooltip says when one does.
export const SoundToggle = ({ module }) => {
	const [chosen, choose] = useSoundModule()
	const on = chosen === module
	const { title } = SOUND_MODULES.find(({ id }) => id === module)
	const elsewhere = SOUND_MODULES.find(({ id }) => id === chosen && id !== module)
	const action = `${on ? "Disable" : "Enable"} sound for ${title}`
	
	return <button
		type="button"
		className={classNames("sound-toggle", { on })}
		aria-pressed={on}
		aria-label={action}
		title={elsewhere ? `${action} (now playing in ${elsewhere.title})` : action}
		onClick={() => choose(on ? NO_SOUND : module)}
	>
		<Glyph on={on} />
	</button>
}
