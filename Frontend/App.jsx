import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginNew from "./src/pages/LoginNew";
import Upload from "./src/pages/Upload";
import Dashboard from "./src/pages/Dashboard";
import Chat from "./src/pages/Chat";
import Library from "./src/pages/Library";
import SavedChats from "./src/pages/SavedChats";
import Settings from "./src/pages/Settings";
import { ThemeProvider } from "./src/context/ThemeContext";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => {
      document
        .querySelectorAll(".chat-layout, .page-container, .upload-page, .bayt-root")
        .forEach((element) => {
          element.scrollTop = 0;
        });
    });
  }, [pathname]);

  return null;
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/login"    element={<LoginNew />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/upload"   element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/chat"     element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/library"  element={<PrivateRoute><Library /></PrivateRoute>} />
          <Route path="/saved"    element={<PrivateRoute><SavedChats /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*"         element={<Navigate to={localStorage.getItem("token") ? "/dashboard" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
