import { createRoot } from "react-dom/client";
import { Component, ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string; componentStack: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "", componentStack: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + "\n\n" + (error.stack || "") };
  }
  componentDidCatch(error: Error, info: any) {
    this.setState({ componentStack: info?.componentStack || "" });
    console.error("ErrorBoundary:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "1rem", fontFamily: "monospace", color: "#333", fontSize: "11px", overflow: "auto", background: "#fff" }}>
          <h2 style={{ fontFamily: "sans-serif", fontSize: "16px", color: "#c00" }}>เกิดข้อผิดพลาด (React Error)</h2>
          <pre style={{ background: "#f5f5f5", padding: "0.75rem", borderRadius: "8px", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "300px", overflow: "auto" }}>{this.state.error}</pre>
          {this.state.componentStack && (
            <details style={{ marginTop: "0.5rem" }}>
              <summary style={{ cursor: "pointer", color: "#666" }}>Component Stack</summary>
              <pre style={{ background: "#f0f0f0", padding: "0.75rem", borderRadius: "8px", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "200px", overflow: "auto" }}>{this.state.componentStack}</pre>
            </details>
          )}
          <button onClick={() => window.location.reload()} style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer", background: "#0066cc", color: "#fff", border: "none", borderRadius: "6px" }}>
            รีโหลดหน้า
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
