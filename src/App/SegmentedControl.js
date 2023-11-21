import classNames from "classnames";

export const SegmentedControl = ({values, titles, value, setValue}) => {
	
	const items = values.map((v, i) => {
		return (
			<button 
				className={classNames({active: value === v})} 
				onClick={() => {setValue(v)}}
			>
				{titles[i]}
			</button>
		)
	})
	
	return <div className="segmented">
		{items}
	</div>
}