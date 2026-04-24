import { createRoot } from "react-dom/client";
import { Component, type ReactNode, type ErrorInfo } from "react";
import App from "./App.tsx";
import { FactoriesProvider } from "./contexts/FactoriesContext";
import "./index.css";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[v0] ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: "sans-serif" }}>
          <h1 style={{ color: "#dc2626", fontSize: 24, marginBottom: 16 }}>
            Erro na aplicacao
          </h1>
          <pre
            style={{
              background: "#f1f5f9",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 14,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: "8px 24px",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log("[v0] main.tsx: Mounting app...");
console.log("[v0] VITE_SUPABASE_URL set:", Boolean(import.meta.env.VITE_SUPABASE_URL));
console.log("[v0] VITE_SUPABASE_ANON_KEY set:", Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY));

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <FactoriesProvider>
      <App />
    </FactoriesProvider>
  </ErrorBoundary>
);
