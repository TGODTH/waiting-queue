import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QueuePage from "./pages/dashboard";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:clinic" element={<QueuePage />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
