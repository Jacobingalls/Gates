import './App.css';
import {useState, useEffect} from "react";
import classNames from "classnames";
import {useKeyPress} from "./Hooks/useKeyPress"

function App() {
  return (
    <div className="App">
      <ButtonExample />
      <NotGateExample />
      <TwoInputGateExample Gate={ OrGate } />
      <TwoInputGateExample Gate={ NorGate } />
      <TwoInputGateExample Gate={ AndGate } />
      <TwoInputGateExample Gate={ NandGate } />
      <TwoInputGateExample Gate={ XorGate } />
      <TwoInputGateExample Gate={ XnorGate } />
    </div>
  );
}

const ButtonExample = () => {
  const [w1, setW1] = useState(false);
  
  return <div className="circuit">
    <div 
      className="circuit-inner" 
      style={{"width": "350px", "height": "100px"}}
    >
      <KeyboardButton 
        x={10} y={30}
        output={setW1} 
        keyboard="1"
      />
      <svg height="100%" width="100%">
        <Wire path="M50,50 h250" on={w1} />
        <Led x={300} y={50} on={w1} />
      </svg>
    </div>
  </div>
}

const NotGateExample = () => {
  
  const [w1, setW1] = useState(false);
  const [w2, setW2] = useState(false); 
  
  return <div className="circuit">
    <div 
      className="circuit-inner" 
      style={{"width": "350px", "height": "100px"}}
    >
      <KeyboardButton 
        x={10} y={30}
        output={setW1} 
        keyboard="1"
      />
      <svg height="100%" width="100%">
        <Wire path="M50,50 h100" on={w1} />
        <Wire path="M200,50 h100" on={w2} />
        <NotGate x={150} y={25} input={w1} output={setW2} />
        <Led x={300} y={50} on={w2} />
      </svg>
    </div>
  </div>
}

const TwoInputGateExample = ({Gate}) => {
  
  const [w1, setW1] = useState(false);
  const [w2, setW2] = useState(false); 
  const [w3, setW3] = useState(false); 
  
  return <div className="circuit">
    <div 
      className="circuit-inner" 
      style={{"width": "350px", "height": "150px"}}
    >
      <KeyboardButton 
        x={10} y={30}
        output={setW1}
        keyboard="1"
      />
      
      <KeyboardButton 
        x={10} y={80}
        output={setW2}
        keyboard="2"
      />
      
      <svg height="100%" width="100%">
        <Wire path="M50,50 h50 v15 h60" on={w1} />
        <Wire path="M50,100 h50 v-15 h60" on={w2} />
        <Wire path="M200,75 h100" on={w3} />
        <Gate x={150} y={50} input1={w1} input2={w2} output={setW3} />
        <Led x={300} y={75} on={w3} />
      </svg>
    </div>
  </div>
}

const KeyboardButton = ({x, y, output, keyboard}) => {
  return <MomentaryButton 
    x={x} y={y} output={output}
    title={keyboard} keyboard={keyboard}
  />
}

const MomentaryButton = ({x, y, output, title, keyboard}) => {
  
  const btnPress = useKeyPress(keyboard)
  
  useEffect(() => {
    output(btnPress)
  }, [btnPress]);
  
  return <button 
    onMouseDown={() => {output(true);}}
    onMouseUp={() => {output(false);}}
    className={classNames({"pressed": btnPress})}
    style={{
      "position": "absolute",
      "top": `${y}px`,
      "left": `${x}px`,
    }}
  >
    {title}
  </button>
}

const ToggleButton = ({x, y, output, title}) => {
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

const Wire = ({path, on}) => {
  return <path className={classNames("wire", {"on": on === true})} d={path} />
}

const NotGate = ({x, y, input, output}) => {
    
    useEffect(() => {
      output(input !== true);
    }, [input]);
  
    return <g transform={`translate(${x},${y})`}>
        {<path 
          class="gate"
          d="M0,5 l40,20 l-40,20 z"
        />}
        <circle 
            class="gate"
            cx="40" cy="25" r="5"
        />
        
        {/* <rect 
          x="0" y="0" 
          width="50"
          height="50"
          stroke="red"
          fill="transparent"
          stroke-width="1"
        /> */}
    </g>
}

const OrGate = ({x, y, input1, input2, output}) => {
    
    useEffect(() => {
      output((input1 === true) || (input2 === true));
    }, [input1, input2]);
  
    return <g transform={`translate(${x},${y})`}>
        <path 
          class="gate"
          d="M0,5 
            a 25 25, 0, 0, 1, 0 40
            a 50 50, 0, 0, 0, 50 -20
            a 50 50, 0, 0, 0, -50 -20
            Z"
        />
        
        {/*<rect 
          x="0" y="0" 
          width="50"
          height="50"
          stroke="red"
          fill="transparent"
          stroke-width="1"
        />*/}
    </g>
}

const NorGate = ({x, y, input1, input2, output}) => {
    
    useEffect(() => {
      output(!((input1 === true) || (input2 === true)));
    }, [input1, input2]);
  
    return <g transform={`translate(${x},${y})`}>
        <path 
          class="gate"
          d="M0,5 
            a 25 25, 0, 0, 1, 0 40
            a 50 50, 0, 0, 0, 45 -20
            a 50 50, 0, 0, 0, -45 -20
            Z"
        />
        
        <circle 
            class="gate"
            cx="45" cy="25" r="5"
        />
        
        {/*<rect 
          x="0" y="0" 
          width="50"
          height="50"
          stroke="red"
          fill="transparent"
          stroke-width="1"
        />*/}
    </g>
}
 
const AndGate = ({x, y, input1, input2, output}) => {
    
    useEffect(() => {
      output((input1 === true) && (input2 === true));
    }, [input1, input2]);
  
    return <g transform={`translate(${x},${y})`}>
        <path 
          class="gate"
          d="M0,5 
            h 30
            a 20 20, 0, 0, 1, 0 40 
            h -30 
            Z"
        />
        
        {/*<rect 
          x="0" y="0" 
          width="50"
          height="50"
          stroke="red"
          fill="transparent"
          stroke-width="1"
        />*/}
    </g>
}

const NandGate = ({x, y, input1, input2, output}) => {
    
    useEffect(() => {
      output(!((input1 === true) && (input2 === true)));
    }, [input1, input2]);
  
    return <g transform={`translate(${x},${y})`}>
        <path 
          class="gate"
          d="M0,5 
            h 20
            a 20 20, 0, 0, 1, 0 40 
            h -20 
            Z"
        />
        
        <circle 
            class="gate"
            cx="45" cy="25" r="5"
        />
        
        {/*<rect 
          x="0" y="0" 
          width="50"
          height="50"
          stroke="red"
          fill="transparent"
          stroke-width="1"
        />*/}
    </g>
}

const XorGate = ({x, y, input1, input2, output}) => {
    
    useEffect(() => {
      output((input1 === true) !== (input2 === true));
    }, [input1, input2]);
  
    return <g transform={`translate(${x},${y})`}>
        <path 
          class="gate-line"
          d="M-1,5 a 21 21, 0, 0, 1, 0 40"
        />
        
        <path 
          class="gate"
          d="M10,5 
            a 25 25, 0, 0, 1, 0 40
            a 50 50, 0, 0, 0, 40 -20
            a 50 50, 0, 0, 0, -40 -20
            Z"
        />
        
        {/*<rect 
          x="0" y="0" 
          width="50"
          height="50"
          stroke="red"
          fill="transparent"
          stroke-width="1"
        />*/}
    </g>
}

const XnorGate = ({x, y, input1, input2, output}) => {
    
    useEffect(() => {
      output((input1 === true) === (input2 === true));
    }, [input1, input2]);
  
    return <g transform={`translate(${x},${y})`}>
        <path 
          class="gate-line"
          d="M-1,5 a 21 21, 0, 0, 1, 0 40"
        />
        
        <path 
          class="gate"
          d="M10,5 
            a 25 25, 0, 0, 1, 0 40
            a 50 50, 0, 0, 0, 35 -20
            a 50 50, 0, 0, 0, -35 -20
            Z"
        />
        
        <circle 
            class="gate"
            cx="45" cy="25" r="5"
        />
        
        {/*<rect 
          x="0" y="0" 
          width="50"
          height="50"
          stroke="red"
          fill="transparent"
          stroke-width="1"
        />*/}
    </g>
}

const Led = ({x, y, on}) => {
  return <circle
    className={classNames("led", {"on": on === true})}
    cx={x}
    cy={y}
    r="10"
  />
}

export default App;
