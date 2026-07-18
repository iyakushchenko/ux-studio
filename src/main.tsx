import { createRoot } from "react-dom/client";
import { ProtoAppErrorBoundary, renderBootstrapError } from "@/app/shell/ProtoAppErrorBoundary";
import "./styles/index.css";

async function boot(): Promise<void> {
  const root = document.getElementById("root");
  if (!root) return;

  try {
    const { default: App } = await import("./app/App.tsx");
    createRoot(root).render(
      <ProtoAppErrorBoundary>
        <App />
      </ProtoAppErrorBoundary>
    );
  } catch (error) {
    renderBootstrapError(root, error);
  }
}

void boot();