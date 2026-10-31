# Gates diagram format (version 1)

Pages and parts are React. Diagrams are JSON files, one per diagram, kept next to the `Section.jsx`
that shows them:

```
src/Lessons/Gates/XorGate/
  Section.jsx
  Circuit.json       the gate as a symbol
  Gates.json         the same gate, zoomed in
  TruthTable.json    the same gate, as a table
```

Every file starts with `"format": 1` and a `kind`. A section imports its files and picks one per tab:

```jsx
import circuit from "./Circuit.json"
import gates from "./Gates.json"
import truthTable from "./TruthTable.json"

{ version === "diagram" && <CircuitDiagram circuit={circuit} /> }
{ version === "gates" && <CircuitDiagram circuit={gates} /> }
{ version === "table" && <TruthTableDiagram table={truthTable} /> }
```

## Circuits

```json
{
	"format": 1,
	"kind": "circuit",
	"size": [350, 150],
	"instances": [
		{ "id": "button_1", "component": "KeyboardButton", "at": [10, 30], "props": { "keyboard": "1" } },
		{ "id": "gate", "component": "AndGate", "at": [165, 50] },
		{ "id": "light", "component": "Led", "at": [330, 75] }
	],
	"nets": [
		{ "id": "w1", "connect": ["button_1.output", "gate.input1"], "route": [[[50, 50], [100, 50], [100, 65], [175, 65]]] },
		{ "id": "w3", "connect": ["gate.output", "light.on"], "route": [[[215, 75], [330, 75]]] }
	]
}
```

- `instances` are parts. `component` names a React component in `PARTS` in
  `src/Circuits/CircuitDiagram.jsx`, or `KeyboardButton`. `at` becomes its `x` and `y` props, and
  `props` are passed through. To add a part, write the React component and add it to `PARTS`.
- Parts that are only drawn work the same way. `Bus` takes its `path` and `label` through `props` and
  needs no `at`, and `BusLabel` takes its text as `props.children`.
- `nets` hold the value of one wire. `connect` lists `instance.prop` terminals, using the part's React
  prop names. A prop called `output`, or starting with `set`, receives the net's setter, and any other
  prop receives its value. Nets start as `false`, and can carry a number, as a counter's does.
- `route` is how the net is drawn: polylines in canvas coordinates, where each one after the first
  starts somewhere on the net. A point can be `{ "hop": [x, y] }`, which arcs from the previous point
  to that one, so a wire can jump over another. A net with no `route` is not drawn.
- `"inverseOf": "q"` makes a read-only net that is always the opposite of net `q`.
- `"delay": 1` makes writes to the net wait that many milliseconds. One net in each feedback loop needs
  this, so the gates in a latch can settle. Which way such a latch powers up is a race, so its
  starting state can differ between page loads until a value is loaded.

## Truth tables

```json
{
	"format": 1,
	"kind": "truthTable",
	"size": [350, 150],
	"at": [85, 3],
	"inputs": [
		{ "title": "Btn. 1", "keyboard": "1", "at": [10, 30] },
		{ "title": "Btn. 2", "keyboard": "2", "at": [10, 80] }
	],
	"outputs": [
		{ "title": "Light", "at": [330, 75] }
	],
	"rows": [
		[0, 0, 0],
		[0, 1, 0],
		[1, 0, 0],
		[1, 1, 1]
	]
}
```

Each row lists input values and then output values. `at` places the table. Each input is a button and
each output is an LED, and the row matching the pressed buttons lights up and drives the LEDs. Every
input combination needs a row.

## State machines

Not rendered yet: this is the planned shape, and nothing reads it.

```json
{
	"format": 1,
	"kind": "stateMachine",
	"machine": "mealy",
	"clock": "clk",
	"initial": "low",
	"states": [
		{ "id": "low", "at": [60, 60] },
		{ "id": "high", "at": [220, 60] }
	],
	"transitions": [
		{ "from": "low", "to": "high", "on": { "d": 1 }, "output": { "pulse": 1 } },
		{ "from": "high", "to": "low", "on": { "d": 0 } }
	]
}
```

`machine` picks where outputs live:

- `moore`: on states, as `"output"`.
- `mealy`: on transitions, as `"output"`.

The machine steps on the rising edge of `clock`. Transitions are tried in order and the first whose
`on` matches is taken. Inputs missing from `on` are don't-cares. If nothing matches, the state holds.

Automata and Turing machines build on the same shape:

- **DFA:** a Moore machine with a symbol input and an `accept` output.
- **NFA:** `"machine": "nfa"`, where several transitions may match.
- **Pushdown automaton:** a Mealy controller wired to a stack part.
- **Turing machine:** a Mealy controller wired to a tape part, shown as a circuit that zooms in to the
  controller's state diagram.
