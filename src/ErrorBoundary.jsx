import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to a logging service (Sentry, etc.)
    // For now just suppress the console noise
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const preview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "error";
    if (!this.state.hasError && !preview) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", background: "#0a0805", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "32px 24px", textAlign: "center", fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>😵</div>
        <h1 style={{
          fontFamily: "'Clash Display', Georgia, serif",
          fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 8,
        }}>Something went wrong</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 300, marginBottom: 32 }}>
          The app hit an unexpected error. Your data is safe — please try again or contact us if it keeps happening.
        </p>

        <button
          onClick={this.handleRetry}
          style={{
            background: "linear-gradient(135deg, #ff5733, #ff8c42)",
            color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px",
            fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 16,
            boxShadow: "0 4px 20px rgba(255,87,51,0.4)",
          }}
        >
          Try Again
        </button>

        <a
          href="mailto:support@gruvio.app?subject=App%20Error&body=Hi%2C%20I%20ran%20into%20an%20error%20in%20the%20Gruvio%20app."
          style={{ fontSize: 14, color: "rgba(255,87,51,0.8)", textDecoration: "none" }}
        >
          Contact Support
        </a>
      </div>
    );
  }
}
