import './App.css';
import { ScrollRestoration } from "react-router-dom";
import { Outlet } from "react-router-dom";

import { Header } from "./Header"

function App() {
  return (
    <div className="App">
      <ScrollRestoration />
      <Header />
      <Outlet />
    </div>
  );
}

export default App;
