import Board from "./Components/Board/Board";
import BoardProvider from "./Components/store/BoardProvider";
import ToolboxProvider from "./Components/store/ToolboxProvider";
import Toolbar from "./Components/Toolbar/Toolbar";
import Toolbox from "./Components/Toolbox/Toolbox";
import Sidebar from "./Components/Sidebar/Sidebar";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import boardContext from './Components/store/board-context';

function AppShell() {
  const { isUserLoggedIn } = useContext(boardContext);
  return (
    <div>
      <Sidebar />
      <Toolbar />
      <Board />
      <Toolbox />
    </div>
  );
}

function App() {
  return (
    <BoardProvider>
      <ToolboxProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/:id" element={<AppShell />} />
            <Route path="/" element={<AppShell />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToolboxProvider>
    </BoardProvider>
  )
}

export default App;
