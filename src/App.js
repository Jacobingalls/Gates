import './App.css';
import {useState, useEffect} from "react";
import classNames from "classnames";

function App() {
  return (
    <div className="App">
      <ButtonExample />
      <NotGateExample />
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

const Led = ({x, y, on}) => {
  return <circle
    className={classNames("led", {"on": on === true})}
    cx={x}
    cy={y}
    r="10"
  />
}

export default App;
