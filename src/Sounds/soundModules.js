import { createContext, useContext, useSyncExternalStore } from "react";

// Everything on the site that can make sound. The first is on until someone picks otherwise.
export const SOUND_MODULES = [
	{ id: "pedestrian-crossing", title: "Pedestrian Crossing" },
]

export const NO_SOUND = "none"

const STORAGE_KEY = "gates-sound-module"

const isChoice = (id) => id === NO_SOUND || SOUND_MODULES.some((module) => module.id === id)

// Storage can be blocked, and the switch still works for as long as the page is open.
const remembered = () => {
	try {
		return localStorage.getItem(STORAGE_KEY)
	} catch {
		return null
	}
}

let chosen = isChoice(remembered()) ? remembered() : SOUND_MODULES[0].id
const listeners = new Set()

const subscribe = (listener) => {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

const getChosen = () => chosen

const choose = (id) => {
	chosen = id
	listeners.forEach((listener) => listener())
	try {
		localStorage.setItem(STORAGE_KEY, id)
	} catch {
		// Nothing to do: the choice lasts until the page closes.
	}
}

// One choice for the whole site, so only one module sounds at a time.
export const useSoundModule = () => [useSyncExternalStore(subscribe, getChosen), choose]

// Which module the Speakers inside it belong to. The editor has none, and always sounds.
export const SoundModule = createContext(undefined);

export const useSoundOn = () => {
	const module = useContext(SoundModule)
	const [current] = useSoundModule()
	return module === undefined || module === current
}
