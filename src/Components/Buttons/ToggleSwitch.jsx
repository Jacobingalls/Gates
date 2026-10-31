export const ToggleButton = ({x, y, output, title}) => {
  return <label class="switch" style={{
	"position": "absolute",
	"top": `${y}px`,
	"left": `${x}px`,
  }}>
	<div class="gradient"></div>
	<input 
	  type="checkbox"
	  onChange={(event) => {output(event.target.checked);}}
	/>
	<div class="slider">
	  <div class="gradient"></div>
	  <div class="handles">
		<div class="handle"></div>
		<div class="handle"></div>
		<div class="handle"></div>
	  </div>
	</div>
  </label>
}
