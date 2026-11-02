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

- An instance or net can have a `"name"`, which is what people read, while `id` is what the file connects
  by. A named part shows its name beside it. An output device with no name of its own takes the name of
  a named net it's on, and in a truth table the name of its variable or bus.
- `"labelSide"` on an instance is `top`, `right`, `bottom`, `left` or `hidden`. Left out, a part's name
  goes in its usual place, and blocks show their title below. Set to a side, the name goes there, or the
  part's title if it has no name, in place of the block's own title. `hidden` shows neither.
- `instances` are parts. `component` names an entry in `PARTS` in `src/Circuits/parts.jsx`, which
  also lists its box, pins and library details. `at` becomes its `x` and `y` props, and `props` are
  passed through. To add a part, write the React component and add it to `PARTS`.
- An instance can have `"rotation"` of 90, 180 or 270, and `"flipX"` or `"flipY"` of `true`. Block
  labels stay upright and readable whichever way the part faces. Buttons and rocker switches always stay upright, and
  only their pin moves, around the sides of the 40×40 grid square the raised button sits in.
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

A top-level `backdrops` list holds rounded boxes drawn under everything else, for grouping parts:
`{ "id": "backdrop_1", "at": [20, 20], "size": [200, 150] }`, with an optional `color` for the fill. `at` is
the top left corner.

### Toggle Latch

The Toggle Latch (`ToggleLatch`) flips `setQ` on each rising edge of `clk` while `t` is high, and `setNotQ`
is always its opposite. With nothing on `t` it flips on every edge, so each one divides its clock by two.
It's edge-triggered, because a truly level-sensitive toggle would oscillate for as long as `clk` is high.
`reset` holds it low straight away, ignoring the clock.

### Register

The Register (`Register`) stores a binary value. On each rising edge of `clk` it takes what's on the `d`
bus and puts it on `setValue`, and holds it there whatever `d` does next. While `reset` is high it holds 0
and ignores the clock. `props.width` sets the size of both buses, 8 bits by default.

### Counter

The Counter (`Counter`) counts up on each rising edge of `clk`, wrapping at its `modulo` prop, and puts
the count on `setValue`. While `reset` is high it holds at 0 and ignores the clock. Nothing on `reset`
just leaves it counting.

`setOverflow` is high for the clock pulse that rolls the count over to 0. Wired to another Counter's
`clk`, the two step together, so the second one counts each rollover of the first.

### Traffic Light

The Traffic Light (`TrafficLight`) has one input per lamp, so whatever drives it decides which are lit.
`props.mode` picks its version, listed top to bottom. Balls are `red`, `yellow` and `green`, and arrows are
`redArrow`, `yellowArrow` and `greenArrow`:

| Mode | Lamps |
| --- | --- |
| `standard` | Red, yellow, green |
| `greenLeft`, `greenRight` | Red, yellow, green, green arrow |
| `redLeft`, `redRight` | Red, yellow arrow, green arrow |
| `arrowsLeft`, `arrowsRight` | Red arrow, yellow arrow, green arrow |
| `fiveLeft`, `fiveRight` | Red, yellow, green, yellow arrow, green arrow |

### BCD and Number Display

The BCD block (`Bcd`) takes a bus on `value` and puts each decimal digit on its own 4-bit bus, on
`setDigit0` (the ones) upward. `props.width` sets the input's size, from 2 to 256 bits in the side
panel, and the block grows a pin for each digit that many bits can need, so 8 bits gives three digits.
It works them out by double dabble, the shift-and-add-3 method hardware uses.

The Number Display (`NumberDisplay`) takes the same `width` on `value` and shows the number in decimal,
using the same digit conversion. Its **Zoom In** button runs the same display as a BCD block driving
one Seven Segment per digit, with a clock and counter feeding it. Nothing in the file changes.

Buses wider than 53 bits hold big integers, so every bit stays exact.

### Walk Light

The Walk Light (`WalkLight`) is only a display, styled on a California crossing signal. It has no timing of
its own, so whatever drives it decides when each part shows, including flashing the hand:

| Pin | Shows |
| --- | --- |
| `walk` | The white walking person, while high |
| `wait` | The orange upraised hand, while high |
| `showTime` | The orange number, while high |
| `time` | The number to show, as a binary bus |

`walk` and `wait` are on the left edge, and `showTime` and `time` are on the bottom edge. `props.width` sets
the size of `time`, 7 bits by default. The face has two digits, so a larger number shows its last two. With
nothing on them, all three parts stay dark.

`props.timer` set to `false` drops the number, along with the `showTime` and `time` pins, and narrows the
face to the hand and person. It's `true` by default.

### Countdown

The Countdown (`Countdown`) counts down from a value on the `start` bus. It loads `start` whenever that
changes to a new value above 0, so a state asserting it is enough to begin. `reset` loads it again, and
holds there while it's high, which is how to repeat the same value. Each rising edge of `clk` takes one off,
stopping at 0. `setValue` is the current count as a bus, and `setZero` is high while the count is 0, which
includes before anything is loaded. `props.width` sets the size of both buses, 7 bits by default.

### LUT

The LUT (`Lut`) is a lookup table: it shows the value stored at its address, straight away and with no
clock. Each address bit is a pin, `A0` being the lowest, and they're gathered on the `address` bus unless
`"bused"` on the instance says otherwise, so any of them can be connected on their own. Its `props` are:

- `addressBits`: how many address bits it has, 1 to 8, which sets how many rows it has.
- `dataBits`: the size of each value, 1 to 32.
- `values`: the rows, in address order. A row with nothing stored reads 0.
- `split`: `false` puts the value on the `setValue` bus. `true` gives each bit its own wire instead, as
  `setBit0` for the lowest bit upward, which is how a LUT drives separate lamps.
- `columns`: names for the table's columns, keyed by `A0` upward, `Q0` upward, `address` and `value`. Pins
  go by these names in the connection and assertion lists.
- `inputFormat` and `outputFormat`: how the side panel shows its table, `bits` or `number`. In `bits`, each
  address reads as its binary columns, and output bits click to switch. They don't change what it does.

### Comparator

The Comparator (`Comparator`) compares the `a` and `b` buses and raises one of `setLess`, `setEqual` or
`setGreater`. `props.width` sets the size of both, 8 bits by default, and an input with nothing on it reads
0. A state machine can compare a bus in a transition without one, so this is for when the result needs to
reach another part.

### Mux and Demux

The Mux (`Mux`) passes one of its inputs, `in0`, `in1` and so on, through to `output`, picked by the number on
`select`. The Demux (`Demux`) does the opposite: it passes `input` to one of `setOut0`, `setOut1` and so on,
and holds the others at 0.

`props.selectBits` sets how many ways there are, 1 by default for two ways, up to 4 for sixteen. `select`
is a plain wire at 1 bit and a bus from 2 up. `props.width` sets the size of the data pins in the same way,
1 by default. Anything with nothing on it reads 0.

At 1 bit, `"bused"` on the instance gathers the many-way pins onto one bus, with the first as bit 0: the
`inputs` bus on a Mux, or the `setOutputs` bus on a Demux.

`props.names` renames pins, keyed by the pin: `{ "in0": "Red", "output": "Lamp" }`. The block widens to fit,
and pins go by these names in the connection and assertion lists.

### Speaker

The Speaker (`Speaker`) plays the clip named by `props.sound` on each rising edge of `start`, and lights up
while it does. `props.volume` is a percent, 100 by default, for balancing sounds against each other.

A clip plays once, so a repeating tone needs something repeating on `start`, such as a Clock, which leaves a
small gap at each repeat. For a seamless repeat, set `props.loop`, which plays the clip for as long as `start`
is high. The first 30 repeats have no gaps at all, and there's a small gap each time that many repeats.

`props.small` draws the Speaker at half size, 25×25.

Only one module on the site makes sound at a time, set with the speaker button in its section's header and
remembered between visits. Turning one on turns off whichever had it, and turning it off leaves none. To add
a module, list it in `SOUND_MODULES` in `src/Sounds/soundModules.js`, put `<SoundToggle module="its-id" />` in
its header, and wrap its diagram in `<SoundModule.Provider value="its-id">`. A Speaker outside a module, as in
the editor, always plays.

The clips are in `src/Sounds/sounds.js`. Most are lists of tones, rendered in the browser and played
through Web Audio. A recording goes in `src/Sounds` and is imported in `recordings.js`. To add one, add an entry to `SOUNDS`:

| Sound | Use |
| --- | --- |
| `buttonBeep` | Confirming a press |
| `locatorTone` | The crossing's locator, 0.15 s, for a 1 Hz Clock |
| `walkTick` | One walk tick, for a 10 Hz Clock |
| `walkTicks` | A second of walk ticks at 880 Hz, for a 1 Hz Clock |
| `cuckoo`, `chirp` | The older crossing sounds |
| `fastChirps` | A second of quick chirps |
| `hereThere` | Three seconds of bird chirps, rising then falling in turn |
| `waitSpeech` | The recorded "Wait" a pilot light has to come with |
| `walkSign` | The recorded "Walk sign is on" |
| `percEW`, `percNS` | One second of recorded walk ticks: 8 for east-west, 10 for north-south |
| `locator` | A recorded locator tone, 0.1 s |

Browsers only play sound after a press, so a Speaker on a lesson page stays quiet until someone has clicked
or pressed a key there.

### Clock

The Clock (`Clock`) starts high and repeats on its own. Its `props` are:

- `frequency`: cycles per second, and any number above 0.
- `duty`: the percent of each cycle spent high. The side panel takes 1 to 99.
- `controlType`: what the `control` pin does. `enable` runs while it's high, and `disable` stops while
  it's high. `always` has no `control` pin and never stops.

`props.restartable`, the side panel's Restart setting, adds a `restart` pin and a row to the block. A rising
edge on it starts the cycle over: the output drops briefly, then rises afresh, so what it drives sees a new
edge even if it was already high. It does nothing while stopped.

With nothing on `control` it just runs. While stopped its `output` is low, and it starts a fresh cycle
when it's allowed to run again. It stands still in the editor and runs in Run and in lessons. A browser can
only carry so many edges through a circuit each second, so past that point the clock stays at that speed
instead of skipping edges. Single edges can land slightly off, but the rate holds.

In a state machine, a Clock dropped in drives the Machine Clock, so it steps the machine.

### Pedestrian Controller

The Pedestrian Controller (`PedestrianController`) is the Pedestrian Crossing lesson's state machine as one
part. Everything it times is counted inside it from one input, `clk`, which should be a 10 Hz Clock, and it
stands still until that runs.

- `request` latches a walk request, shown on `setRequested` until the walk sign comes on.
- `start` begins a cycle if a request is latched, and is dropped if not.
- `walkSeconds` and `flashSeconds` are buses of `props.width` bits, read as each phase starts. With nothing
  on them, or at 0, `props.walkTime` and `props.flashTime` apply, which are 5 and 8.

`setWalk`, `setWait`, `setShowTime` and `setTime` go to a Walk Light of the same `width`, and `setHold` holds
cross traffic. `setWalkSign`, `setWaitSpeech`, `setLocator` and `setPerc` each go to a Speaker's `start`. `setPerc` is high
through Walk, so a Demux can send it to one of several walk sounds, as the lesson's does for each direction. The last two kinds of sound repeat on their own: the wait speech every 5 s while a request is latched,
starting over at each press of `request`, and the locator every 5 s at rest and every second during Flashing Hand and Buffer. A cycle is Walk Sign On for
2 s, Walk, Flashing Hand and then Buffer for 2 s. Every pin is optional.

### Pins on a bus

Some parts have a group of pins, listed as their `bank` in `PARTS`, that can be gathered onto one bus
pin. `"bused"` on an instance lists which ones, and the rest stay separate:

```json
{ "id": "register", "component": "EightBitShiftRegister", "at": [100, 25], "bused": ["setQ0", "setQ1", "setQ2", "setQ3"] }
```

| Part | Pins | Bus pin | Gathered by default |
| --- | --- | --- | --- |
| Seven Segment, `"mode": "segments"` | `a` to `g` | `segments` | none |
| Seven Segment, `"mode": "hex"` | `d8`, `d4`, `d2`, `d1` | `value` | all |
| 8-Bit Shift Register | `setQ0` to `setQ7` | `setValue` | none |
| LUT | `A0` upward | `address` | all |

The Seven Segment's `mode` goes in `props`. Segments lights each segment directly, and Hex Number shows
a number from 0 to F.

A Seven Segment's decimal point has its own optional pin, `point`, whichever mode it's in. `props.point` set
to `true` lights it with nothing connected. A Number Display's `props.decimalPlaces` puts a lit point that many
digits in from the right, in the side panel's Decimal setting. It only changes how the number is shown, so a
`value` of 123 with one place reads 12.3.

The Seven Segment and Number Display also take `props.small`, which draws them at half size, and
`props.color`, a `#rrggbb` color for the lit segments in place of the usual red.

A bus needs at least two pins. Its first pin is bit 0, except on the Hex Number, where the first pin is
the top bit. Its pin sits where its first pin would, and at the part's usual spot
when it takes them all.

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

## Truth tables and state machines

These two kinds share what makes up a circuit: `size`, `instances` and `labels`, placed the same way.
What's different is what runs them, and neither draws wires.

A truth table has named **variables** in `inputs` and `outputs`, and each part connects to them with `bind`:

```json
"inputs": [{ "name": "a" }, { "name": "b" }],
"outputs": [{ "name": "hi", "bus": "level" }, { "name": "lo", "bus": "level" }, { "name": "y" }],
"instances": [
	{ "id": "button_1", "component": "KeyboardButton", "at": [10, 30], "props": { "keyboard": "1" }, "bind": { "output": "a" } },
	{ "id": "switch_1", "component": "ToggleSwitch", "at": [10, 80], "props": { "keyboard": "2" }, "bind": { "output": "b" } },
	{ "id": "light_1", "component": "Led", "at": [300, 40], "bind": { "on": "y" } },
	{ "id": "display_1", "component": "NumberDisplay", "at": [300, 70], "props": { "width": 2 }, "bind": { "value": "level" } }
],
"nets": []
```

`bind` is keyed by the part's pins in `PARTS`, the same names wires use in a circuit:

- Pins that output, such as a button's `output`, connect to an **input** variable and set it.
- Pins that input connect to an **output** variable and read it.
- A bus pin connects to a bus of the same size, by name. Its pins and the bus's variables pair up in
  order, so the bus's first variable goes to the pin's first bit.
- `null`, or a pin that isn't listed, is unconnected.

Giving variables the same `"bus"` makes them a bus. They stay separate columns and separate outputs, so
any of them can still connect on their own, and they don't need to sit next to each other. A truth table
names each bus above its columns.

### Truth tables

```json
{
	"format": 1,
	"kind": "truthTable",
	"size": [350, 150],
	"at": [85, 3],
	"inputs": [{ "name": "a" }, { "name": "b" }],
	"outputs": [{ "name": "y" }],
	"instances": [],
	"nets": [],
	"rows": [
		[0, 0, 0],
		[0, 1, 0],
		[1, 0, 0],
		[1, 1, 1]
	]
}
```

`at` places the table. Each row lists the inputs and then the outputs, and every input combination
needs a row. The row matching the inputs lights up and sets the outputs.

### State machines

```json
{
	"format": 1,
	"kind": "stateMachine",
	"machine": "moore",
	"size": [600, 300],
	"instances": [
		{ "id": "run", "component": "RockerSwitch", "at": [10, 30], "props": { "keyboard": "1" } },
		{ "id": "clock", "component": "Clock", "at": [100, 30], "props": { "frequency": 1, "duty": 50, "controlType": "enable" } },
		{ "id": "walk", "component": "KeyboardButton", "at": [10, 90], "props": { "keyboard": "2" } },
		{ "id": "light1", "component": "TrafficLight", "at": [450, 40] }
	],
	"nets": [],
	"connections": [
		{ "from": "run.output", "to": "clock.control" },
		{ "from": "clock.output", "to": "machine.clock" }
	],
	"constants": [],
	"initial": "s1",
	"states": [
		{ "id": "s1", "name": "Stop", "at": [150, 150], "assert": { "light1.red": 1 } },
		{ "id": "s2", "name": "Go", "at": [300, 150], "assert": { "light1.green": 1 } }
	],
	"transitions": [
		{ "id": "t1", "from": "s1", "to": "s2", "on": { "walk.output": 1 } },
		{ "id": "t2", "from": "s2", "to": "s1" }
	]
}
```

There are no variables. Everything names part pins directly, as `instance.prop`.

- `connections` run from a part's output to a part's input of the same size, and work whatever state the
  machine is in. `machine.clock` is the machine's own clock, and it steps on that signal's rising edge. A
  pin takes one connection.
- A bus input can also take one of its bits by that pin's name, such as `lut.A0`, in a connection or an
  assertion, which goes over what the bus says for that bit.
- `assert` sets input pins. In a `moore` machine it's on states, and in a `mealy` machine it's on
  transitions, following the inputs as soon as they change. A value is a number, or the name of a constant,
  and it has to fit the pin. A pin with a connection on it can't be asserted. A pin with neither gets
  nothing, so outputs read low and a Clock's control leaves it running.
- `on` lists the outputs a transition tests. A wire is tested as 0 or 1. A bus is compared with a number or
  constant, as `{ "op": "<", "value": 10 }`, and `op` is `<`, `<=`, `=`, `!=`, `>=` or `>`. Transitions are
  tried in order and the first that matches is taken. Outputs left out are don't-cares, and if nothing
  matches, the state holds.
- `label` replaces the text a transition shows, which otherwise says what it tests, and can have several
  lines. `curve` bends its line,
  as `[x, y]` from the middle of the line between its states, and `labelOffset` moves its label from the
  middle of the line. In the editor, select a transition and drag its handle or its label.
- `constants` name numbers, for bus inputs, so a state can say what it means. Changing one changes
  everything that uses it.

`at` is the centre of a state, and `radius` is its size, 30 unless set. A state's name wraps and shrinks to
fit inside it. `summary` is optional text saying what a state means, shown
under it in place of what it asserts. In the editor, hovering over a state with a summary opens a card
listing its assertions. While the machine runs, clicking any state jumps the machine there.

Sections show these with `<TruthTableDiagram table={table} />` and
`<StateMachineDiagram machine={machine} />`.

Automata and Turing machines build on the same shape:

- **DFA:** a Moore machine with a symbol input and an `accept` output.
- **NFA:** `"machine": "nfa"`, where several transitions may match.
- **Pushdown automaton:** a Mealy controller wired to a stack part.
- **Turing machine:** a Mealy controller wired to a tape part, shown as a circuit that zooms in to the
  controller's state diagram.

## Editor

`/editor` has a tab for each kind of file: Circuit, Truth Table and State Machine. Each tab keeps its
own work, undo history and autosave, and Open goes to the tab that matches the file. New clears only
the current tab. Save writes one entry per line, so the file can replace the one in `src/Lessons`, with
circuits and state machines moved back to 0,0. Chrome and Edge show the system save panel. Other
browsers don't offer one to web pages, so Save downloads the file.

All three tabs work the same way: a library, a grid and a side panel, with the same selecting,
rotating, copying, Fit Box and Run. Only what's on the grid differs.

In a **Truth Table**, the library holds inputs and outputs. A part dragged in
connects itself to free variables, and adds new ones if it's short, so a Seven Segment adds `a` to `g`.
A part's Name replaces the name of the variable or bus it connects to wherever those are shown, without
renaming it, and any name typed there also shows while running. In a state machine it names the part
everywhere, so naming a Traffic Light `light1` gives you `light1 Red=1`. Select a part to change what it's connected to. With nothing selected, the side panel lists the
variables, and renaming one updates everything that uses it. Each variable's menu puts it on a bus: New
Bus starts one, and the bus's name can be changed under the list. A part with a bus pin connects to a
free bus of its size, or gathers free variables into a new one.

In a **State Machine**, the library adds Math and Memory parts, and there's nothing to set up before
placing them. With nothing selected, the side
panel lists **Connections** and **Constants**: Add Connection joins any part's output to another part's
input, or to the Machine Clock. Selecting a state lists its **Assertions**, such as `light1 = red`, on any
part's input that no connection is using. In a Mealy machine those go on transitions. A dropped Clock
takes over the Machine Clock.

The truth table sits on the grid. Click an output to switch it, and drag anywhere else on it to move it.

State machines add the State (`S`) and Transition (`T`) tools, and State is in the library too. Click
two states to connect them, or one twice for a loop.

The rest of this section applies to circuits.

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

Selecting a part shows its settings. The Seven Segment's Input picks Segments or Hex Number, and On a
Bus picks which pins share a bus, on any part that has some. Two ticks make the bus. Changing either
takes off anything connected to a pin that's gone, moved or changed size, and leaves the wire in place.

Pins are strict about what connects: a bus pin takes only a bus of its size, and every other pin takes
only a wire, apart from the Counter's output, which takes either. A new bus drawn to a pin takes that
pin's size, and resizing a bus disconnects it from pins it no longer fits.

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

Selecting a part, wire or bus also shows its Name and Id. An Id has to be unique and can't contain a
space or a dot, and changing one updates everything that connects to it. Clearing a Name goes back to
the default, shown faintly in the field.

Run tests the circuit as it stands, unsaved edits included, using the same renderer as the lessons.
Editing is locked and the keyboard goes to the circuit's buttons until Stop, and each run starts fresh.
As in a lesson, anything outside the box is cut off.
