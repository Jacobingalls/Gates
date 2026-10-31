import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App/App';
import reportWebVitals from './reportWebVitals';

import { LogicGatesLesson } from "./Lessons/Gates/LogicGatesLesson"
import { InvertedLogicGatesLesson } from "./Lessons/InvertedGates/InvertedLogicGatesLesson"
import { SequentialCircuitsLesson } from "./Lessons/SequentialCircuits/SequentialCircuitsLesson"
import { StateMachineLesson } from "./Lessons/StateMachines/StateMachineLesson"
import { BussesLesson } from "./Lessons/Busses/BussesLesson"
import { Editor } from "./Editor/Editor"

import {
  createBrowserRouter,
  RouterProvider,
  Navigate
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Navigate to="/lessons/logic-gates" />
      }, {
        path: "lessons/logic-gates",
        element: <LogicGatesLesson />
      }, {
        path: "lessons/inverted-logic-gates",
        element: <InvertedLogicGatesLesson />
      }, {
        path: "lessons/sequential-circuits",
        element: <SequentialCircuitsLesson />
      }, {
        path: "lessons/busses",
        element: <BussesLesson />
      }, {
        path: "lessons/state-machines",
        element: <StateMachineLesson />
      }, {
        path: "editor",
        element: <Editor />
      }
    ]
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
