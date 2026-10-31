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

- `instances` are parts. `component` names an entry in `PARTS` in `src/Circuits/parts.jsx`, which
  also lists its box, pins and library details. `at` becomes its `x` and `y` props, and `props` are
  passed through. To add a part, write the React component and add it to `PARTS`.
- An instance can have `"rotation"` of 90, 180 or 270, and `"flipX"` or `"flipY"` of `true`. Block
  labels stay upright and readable whichever way the part faces. Buttons always stay upright, and only
  their pin moves, around the sides of the 40×40 grid square the raised button sits in.
- Every pin with no wire on it shows a short stub, worked out from `PARTS`, and a pin marked `bus` there
  shows a dimmed bus. Files don't store these.
- A light's `props.color` is `red`, `yellow`, `green` or a `#rrggbb` color.
- `nets` hold the value of one wire. `connect` lists `instance.prop` terminals, using the part's React
  prop names. A prop called `output`, or starting with `set`, receives the net's setter, and any other
  prop receives its value. Nets start as `false`, and can carry a number, as a counter's does.
- `route` is how the net is drawn: polylines in canvas coordinates, where each one after the first
  starts somewhere on the net. A net with no `route` is not drawn.
- `points` lists the connection dots placed on a net, as `[[x, y]]`. Nothing draws them automatically.
- Jumps are worked out when drawing, so files don't store them. Where two straight horizontal and
  vertical runs of different nets cross, a wire jumps a bus, and otherwise the vertical run jumps.
  Diagonal runs don't jump.
- A route point can be `{ "hop": [x, y] }`, which arcs from the previous point to that one by hand.
- `"inverseOf": "q"` makes a read-only net that is always the opposite of net `q`.
- `"color": "#rrggbb"` colors a wire or bus.
- `"delay": 1` makes writes to the net wait that many milliseconds. One net in each feedback loop needs
  this, so the gates in a latch can settle. Which way such a latch powers up is a race, so its
  starting state can differ between page loads until a value is loaded.

A top-level `labels` list holds text: `{ "id": "label_1", "text": "Clock", "at": [130, 35] }`, with
an optional `color`. `at` is the start of the text's baseline.

### Buses

A net with a `width` is a bus. It joins part pins like any net, and carries a number.

```json
{ "id": "bus_1", "width": 4, "connect": [], "route": [[[250, 20], [250, 130]]], "bits": ["a", "b", "", ""], "tick": [250, 75] }
```

- `bits` names bits by position. A blank name shows the bit's number.
- `tick` is where the width mark sits. Without it, the mark goes at the middle of the longest run.

A wire connects to one bit with a tap, and its name is drawn beside the wire:

```json
{ "id": "wire_1", "connect": ["button_1.output"], "route": [[[50, 50], [250, 50]]], "taps": [{ "bus": "bus_1", "bit": 0, "at": [250, 50] }] }
```

Every wire tapped to the same bit carries the same signal, so one wire can drive a bit and another can
read it elsewhere on the bus. A counter driving the bus sets its bits too.

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

## Editor

`/editor` edits circuit files. Open loads one from disk. Save writes it back with the box moved to 0,0
and one instance, net or label per line, so it can replace the file in `src/Lessons`. Chrome and Edge
show the system save panel. Other browsers don't offer one to web pages, so Save downloads the file.

| Key | Action |
| --- | --- |
| `V`, `W`, `B`, `P` | Select, Wire, Bus and Point tools |
| `R`, `X`, `Y` | Rotate, flip X and flip Y the selected parts, each in place |
| Cmd/Ctrl+A | Select everything |
| Cmd/Ctrl+C, X, V | Copy, cut and paste |
| Cmd/Ctrl+D | Duplicate |
| Delete | Delete the selection |
| Enter | Finish a drawing with the points placed so far |
| Escape | Cancel a drawing, or leave the Wire or Bus tool and clear the selection. While running, stop |
| Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z | Undo and redo |

With the Wire or Bus tool, click to start and click to add corners. The first direction you move from
a point sets the shape of the corner, so moving down first goes vertical and then horizontal. A click
on a pin or wire finishes the drawing and connects to it. Enter finishes with only the points placed
so far, and a double click finishes at the point it adds. A wire ending on a bus taps its next unused
bit, which can be changed by selecting the wire.

The Point tool places a connection dot on a wire or bus. Placing one where two wires or two buses
cross joins them, and the jump goes away. A wire and a bus can't share a point: tap the bus instead.
Click a point to select it, and Delete removes the dot but leaves anything it joined connected.

Click to select, and Shift or Cmd/Ctrl+click to add or remove. Drag across empty canvas to box select:
parts, labels and wires wholly inside are selected, along with the corners of wires that are only
partly inside, and everything highlights as you drag. Shift+drag selects parts and labels only, and
adds to the selection, and Cmd/Ctrl+drag adds with wires included. Dragging a selected item moves the
whole selection, and moved corners reshape their wires. Wire ends on a pin or bus stay with what
they're connected to. Click the edge of the circuit box to show its size and resize handles, and use Fit Box (`F`) to wrap
it around everything in the circuit.

Copying takes the selected parts, labels and wires, plus any wire that only connects parts being
copied. Pasted items get new ids, and connections to anything left behind are dropped. Copying a
segment copies its whole wire. The copy lasts until the page reloads, and carries between files.

Clicking a wire selects that segment. Delete removes just the segment, and if that cuts the wire in
two, it becomes two separate nets. Double click a wire to select all of it, and double click it again
to add a corner there. With either selected, drag a corner or a straight run to reshape it. Dragging
the end of a wire off a pin or bus disconnects it, and dropping an end on a pin or wire connects it.
Sliding a wire's end along its bus keeps the same bit. Drag a bus's width mark to move it along the bus.

The circuit in progress is kept in this browser's `localStorage`, so it survives reloads and closing
the tab. Undo history starts fresh after a reload, and files only change on disk through Save.

Run tests the circuit as it stands, unsaved edits included, using the same renderer as the lessons.
Editing is locked and the keyboard goes to the circuit's buttons until Stop, and each run starts fresh.
As in a lesson, anything outside the box is cut off.

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
