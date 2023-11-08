import './App.css';
import {useState, useEffect} from "react";
import classNames from "classnames";

function App() {
  return (
    <div className="App">
      <ButtonExample />
      <NotGateExample />
      <OrGateExample />
      <AndGateExample />
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
      <MomentaryButton 
        x={10} y={30} 
        title={"Push"} 
        output={setW1} 
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
      <MomentaryButton 
        x={10} y={30} 
        title={"Push"} 
        output={setW1} 
      />
      <svg height="100%" width="100%">
        <Wire path="M50,50 h100" on={w1} />
        <NotGate x={150} y={25} input={w1} output={setW2} />
        <Wire path="M200,50 h100" on={w2} />
        <Led x={300} y={50} on={w2} />
      </svg>
    </div>
  </div>
}

const OrGateExample = () => {
  
  const [w1, setW1] = useState(false);
  const [w2, setW2] = useState(false); 
  const [w3, setW3] = useState(false); 
  
  return <div className="circuit">
    <div 
      className="circuit-inner" 
      style={{"width": "350px", "height": "150px"}}
    >
      <ToggleButton 
        x={10} y={30} 
        title={"Push"} 
        output={setW1} 
      />
      
      <ToggleButton 
        x={10} y={80} 
        title={"Push"} 
        output={setW2} 
      />
      
      <svg height="100%" width="100%">
        <Wire path="M50,50 h50 v15 h60" on={w1} />
        <Wire path="M50,100 h50 v-15 h60" on={w2} />
        <OrGate x={150} y={50} input1={w1} input2={w2} output={setW3} />
        <Wire path="M200,75 h100" on={w3} />
        <Led x={300} y={75} on={w3} />
      </svg>
    </div>
  </div>
}

const AndGateExample = () => {
  
  const [w1, setW1] = useState(false);
  const [w2, setW2] = useState(false); 
  const [w3, setW3] = useState(false); 
  
  return <div className="circuit">
    <div 
      className="circuit-inner" 
      style={{"width": "350px", "height": "150px"}}
    >
      <ToggleButton 
        x={10} y={30} 
        title={"Push"} 
        output={setW1} 
      />
      
      <ToggleButton 
        x={10} y={80} 
        title={"Push"} 
        output={setW2} 
      />
      
      <svg height="100%" width="100%">
        <Wire path="M50,50 h50 v15 h60" on={w1} />
        <Wire path="M50,100 h50 v-15 h60" on={w2} />
        <AndGate x={150} y={50} input1={w1} input2={w2} output={setW3} />
        <Wire path="M200,75 h100" on={w3} />
        <Led x={300} y={75} on={w3} />
      </svg>
    </div>
  </div>
}

const MomentaryButton = ({x, y, output, title}) => {
  return <button 
    onMouseDown={() => {output(true);}}
    onMouseUp={() => {output(false);}}
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
            cx="40" cy="25" r="7"
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

const Led = ({x, y, on}) => {
  return <circle
    className={classNames("led", {"on": on === true})}
    cx={x}
    cy={y}
    r="10"
  />
}

export default App;
