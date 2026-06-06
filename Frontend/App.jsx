import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginNew from "./src/pages/LoginNew";
import Upload from "./src/pages/Upload";
import Chat   from "./src/pages/Chat";
import { ThemeProvider } from "./src/context/ThemeContext";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"  element={<LoginNew />} />
          <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/chat"   element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="*"       element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}