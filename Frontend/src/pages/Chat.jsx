import { useState, useEffect } from "react";
import { askQuestion, uploadPDF, getAllDocs, deleteDocById } from "../apis/axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import SourcePanel from "../components/SourcePanel";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchDocs();
    }
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await getAllDocs();
      setDocs(res.data || []);
    } catch (e) {
      setDocs([]);
    }
  };

  const handleSend = async () => {
    const q = input?.trim();
    if (!q) return;

    const userMsg = { role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await askQuestion(q);
      const assistant = { 
        role: "assistant", 
        content: res.data.answer || "", 
        response_time: res.data.response_time 
      };
      setMessages((m) => [...m, assistant]);
      setSources(res.data.sources || []);
    } catch (err) {
      const errMsg = { 
        role: "assistant", 
        content: "Error: could not contact server." 
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload PDF files only');
      return;
    }

    try {
      await uploadPDF(file);
      await fetchDocs();
      alert(`Uploaded: ${file.name}`);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  return (
    <>
      <Navbar />
      <div className="chat-layout">
        <Sidebar 
          docs={docs}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          onUpload={handleUpload}
        />
        <ChatBox 
          selectedDoc={selectedDoc}
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isLoading={loading}
        />
        <SourcePanel sources={sources} />
      </div>
    </>
  );
}
