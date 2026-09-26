import { Component } from "react";
import { COLORS } from "../theme";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught UI error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ backgroundColor: COLORS.cream }}>
          <div className="w-full max-w-sm rounded-[32px] p-6 text-center" style={{ backgroundColor: COLORS.creamCard }}>
            <h1 className="font-display font-bold text-[20px] mb-2" style={{ color: COLORS.ink }}>
              Something went wrong
            </h1>
            <p className="font-body text-[13.5px] mb-5" style={{ color: "rgba(18,49,40,0.6)" }}>
              Reload to get back to your household — your data is saved in this browser.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl py-3.5 font-body font-semibold text-[14.5px] transition-transform active:scale-[0.98]"
              style={{ backgroundColor: COLORS.lime, color: COLORS.ink }}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
