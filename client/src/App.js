import './App.css';
import Lobby from './Components/lobby/Lobby';
import Room from './Components/room/Room';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Lobby />} />
          <Route path='/:roomID' element={<Room />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
