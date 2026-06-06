import { useState, useEffect } from "react";
import { askQuestion, uploadPDFWithProgress, getAllDocs } from "../apis/axios";
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
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchDocs();
    }
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await getAllDocs();
      const nextDocs = res.data || [];
      setDocs(nextDocs);
      return nextDocs;
    } catch (e) {
      setDocs([]);
      return [];
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

    setUploadStatus({
      fileName: file.name,
      progress: 0,
      state: "uploading",
      message: "Starting upload",
    });

    let uploadWatchdog;

    try {
      console.info("Uploading PDF:", file.name);
      uploadWatchdog = window.setTimeout(() => {
        setUploadStatus((current) => {
          if (!current || current.progress > 0) return current;

          return {
            ...current,
            message: "Waiting for backend to accept the file",
          };
        });
      }, 4000);

      const res = await uploadPDFWithProgress(file, (progress) => {
        setUploadStatus((current) => ({
          fileName: current?.fileName || file.name,
          progress,
          state: progress >= 100 ? "processing" : "uploading",
          message:
            progress >= 100
              ? "File uploaded; indexing document"
              : `${progress}% uploaded`,
        }));
      });

      window.clearTimeout(uploadWatchdog);
      setUploadStatus({
        fileName: file.name,
        progress: 100,
        state: "processing",
        message: "Indexing document",
      });

      const nextDocs = await fetchDocs();
      const uploadedDoc = nextDocs.find(
        (doc) => doc.id === res.data.document_id
      );
      setSelectedDoc(
        uploadedDoc || {
          id: res.data.document_id,
          filename: res.data.filename || file.name,
        }
      );
      setUploadStatus({
        fileName: res.data.filename || file.name,
        progress: 100,
        state: "complete",
        message: `${res.data.chunks || 0} chunks indexed`,
      });

      window.setTimeout(() => {
        setUploadStatus((current) =>
          current?.fileName === (res.data.filename || file.name) ? null : current
        );
      }, 3500);
    } catch (err) {
      window.clearTimeout(uploadWatchdog);
      console.error(err);
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Upload failed";
      setUploadStatus({
        fileName: file.name,
        progress: 0,
        state: "error",
        message,
      });
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
          uploadStatus={uploadStatus}
        />
        <ChatBox 
          selectedDoc={selectedDoc}
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isLoading={loading}
          onClear={() => {
            setMessages([]);
            setSources([]);
          }}
          onClearSelectedDoc={() => setSelectedDoc(null)}
        />
        <SourcePanel sources={sources} />
      </div>
    </>
  );
}
