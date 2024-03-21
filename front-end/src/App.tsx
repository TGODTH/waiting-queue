import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QueuePage from "./pages/QueuePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<p className="alert-text">Invalid path</p>}
        ></Route>
        <Route path="/:clinic" element={<QueuePage />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
