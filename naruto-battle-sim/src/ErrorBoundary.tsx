import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui", color: "white" }}>
          <h1 style={{ margin: 0 }}>UI crashed</h1>
          <pre style={{ whiteSpace: "pre-wrap", opacity: 0.9 }}>
            {String(this.state.error.stack || this.state.error.message)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
