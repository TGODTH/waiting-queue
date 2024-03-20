import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QueuePage from "./pages/QueuePage";

import "./css/main.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                color: "black",
                fontSize: "32px",
                fontWeight: "500",
              }}
            >
              Invalid path
            </div>
          }
        ></Route>
        <Route path="/:clinic" element={<QueuePage />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
