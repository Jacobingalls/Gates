// From: https://www.reacthooklab.com/use-key-press

import { useState, useEffect } from 'react'

export const useKeyPress = (targetKey) => {
	const [isKeyPressed, setIsKeyPressed] = useState(false)
	
	useEffect(() => {
		const downHandler = ({ key }) => {
			if (key === targetKey) {
				setIsKeyPressed(true)
			}
		}
		
		const upHandler = ({ key }) => {
			if (key === targetKey) {
				setIsKeyPressed(false)
			}
		}
		
		window.addEventListener('keydown', downHandler)
		window.addEventListener('keyup', upHandler)
		
		return () => {
			window.removeEventListener('keydown', downHandler)
			window.removeEventListener('keyup', upHandler)
		}
	}, [targetKey])
	
	return isKeyPressed
}
