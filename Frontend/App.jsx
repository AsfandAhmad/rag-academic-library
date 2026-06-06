import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginNew from "./src/pages/LoginNew";
import Upload from "./src/pages/Upload";
import Chat from "./src/pages/Chat";
import Library from "./src/pages/Library";
import SavedChats from "./src/pages/SavedChats";
import Settings from "./src/pages/Settings";
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
          <Route path="/login"    element={<LoginNew />} />
          <Route path="/upload"   element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/chat"     element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/library"  element={<PrivateRoute><Library /></PrivateRoute>} />
          <Route path="/saved"    element={<PrivateRoute><SavedChats /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*"         element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}