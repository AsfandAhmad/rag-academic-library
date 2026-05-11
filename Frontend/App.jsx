import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login  from "./src/pages/Login";
import Upload from "./src/pages/Upload";
import Chat   from "./src/pages/Chat";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"  element={<Login />} />
        <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
        <Route path="/chat"   element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="*"       element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}