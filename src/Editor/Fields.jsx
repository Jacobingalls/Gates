import { useEffect, useState } from "react";

export const Field = ({ label, children }) => {
	return <label className="editor-field">
		<span>{label}</span>
		{children}
	</label>
}

export const NumberField = ({ label, value, min, max, onChange }) => {
	return <Field label={label}>
		<input
			type="number"
			min={min} max={max}
			value={value}
			onChange={(event) => {
				const number = parseInt(event.target.value, 10)
				if (!Number.isNaN(number) && number >= min && (max === undefined || number <= max)) {
					onChange(number)
				}
			}}
		/>
	</Field>
}

// Takes effect when you leave the field, and goes back to the value if it's refused.
export const CommitField = ({ label, value, onCommit }) => {
	const [text, setText] = useState(value);
	useEffect(() => setText(value), [value]);
	
	return <Field label={label}>
		<input
			aria-label={label}
			value={text}
			onChange={(event) => setText(event.target.value)}
			onKeyDown={(event) => event.key === "Enter" && event.target.blur()}
			onBlur={() => {
				onCommit(text)
				setText(value)
			}}
		/>
	</Field>
}

export const NameField = ({ value, placeholder, onChange }) => {
	return <Field label="Name">
		<input
			aria-label="Name"
			value={value ?? ""}
			placeholder={placeholder}
			onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value)}
		/>
	</Field>
}

// Keeps what's typed, so a value like 0.5 can pass through "0." on the way there.
export const DecimalInput = ({ label, value, accepts, onChange }) => {
	const [text, setText] = useState(`${value}`);
	useEffect(() => setText(`${value}`), [value]);
	
	return <input
		type="number"
		step="any"
		aria-label={label}
		value={text}
		onChange={(event) => {
			setText(event.target.value)
			const number = parseFloat(event.target.value)
			if (accepts(number)) {
				onChange(number)
			}
		}}
		onBlur={() => setText(`${value}`)}
	/>
}

export const DecimalField = ({ label, value, accepts, onChange }) => {
	return <Field label={label}>
		<DecimalInput label={label} value={value} accepts={accepts} onChange={onChange} />
	</Field>
}
