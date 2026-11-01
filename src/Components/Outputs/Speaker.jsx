import "./Speaker.css"

import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import { useSoundOn } from "../../Sounds/soundModules"
import { playSound, prepareAudio, soundLength, startLoop, stopLoop } from "../../Sounds/sounds"
import { SMALL_SCALE } from "./SevenSegment"

export const SPEAKER_SIZE = [50, 50]

// Plays its clip on each rising edge of `start`, and lights up while it does. With `loop`,
// it plays the clip over and over for as long as `start` is high. It lights up the same when
// its module's sound is off, since the circuit is still doing it, and just stays quiet.
export const Speaker = ({x, y, start, sound, volume, loop, small, still}) => {
	const [plays, setPlays] = useState(0);
	const [playing, setPlaying] = useState(false);
	const wasHigh = useRef(false);
	const soundOn = useSoundOn();
	
	useEffect(() => prepareAudio(sound), [sound]);

	const looping = loop === true && start === true && still !== true

	useEffect(() => {
		if (!looping || !soundOn) {
			return
		}
		startLoop(sound, volume)
		return () => stopLoop(sound)
	}, [looping, soundOn, sound, volume]);
	
	useEffect(() => {
		const startBool = (start === true) && still !== true
		const rising = startBool && !wasHigh.current
		wasHigh.current = startBool
		if (rising && loop !== true) {
			if (soundOn) {
				playSound(sound, volume)
			}
			setPlays((count) => count + 1)
		}
	}, [start, sound, volume, loop, still, soundOn]);
	
	// Follows the clip rather than `start`, which can fall while it's still playing.
	useEffect(() => {
		if (plays === 0) {
			return
		}
		setPlaying(true)
		const finishing = setTimeout(() => setPlaying(false), soundLength(sound) * 1000)
		return () => clearTimeout(finishing)
	}, [plays, sound]);
	
	return <g transform={`translate(${x},${y}) scale(${small ? SMALL_SCALE : 1})`} className={classNames("speaker", { on: playing || looping })}>
		<rect width={SPEAKER_SIZE[0]} height={SPEAKER_SIZE[1]} rx="8" />
		<path className="speaker-cone" d="M12,20 h8 l10,-9 v28 l-10,-9 h-8 z" />
		<path className="speaker-wave" d="M34,18 a10,10 0 0,1 0,14 M38,13 a16,16 0 0,1 0,24" />
	</g>
}
