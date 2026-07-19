import { useState } from "react";
import { AnimatePresence, motion } from "@/uxds/motion";
import { SitePilotComposer } from "../shared/SitePilotComposer";
import { CHAT_REACT_SCREEN_ID } from "./chatContract";
import "./chat.css";

export type ChatScreenProps = {
  onSend?: (query: string) => void;
};

export function ChatScreen({ onSend }: ChatScreenProps) {
  const [query, setQuery] = useState("");

  return (
    <main
      className="chat"
      data-studio-react-screen={CHAT_REACT_SCREEN_ID}
      data-name="body"
      aria-label="Agentic Site Pilot chat"
    >
      <div className="chat__thread" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key="chat-scaffold-placeholder"
            className="chat__placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {/* TODO(Bea): thread bands from CHAT_MAKE_PARITY_REGISTER when filed */}
            <p className="chat__placeholder-text">
              Chat thread — Make parity scaffold (messages TBD).
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="chat__composer-dock" aria-label="Message composer">
        <div
          className="chat__composer-card proto-site-pilot-composer"
          data-name="component.co.order.summary"
        >
          <SitePilotComposer
            surface="chat"
            query={query}
            onQueryChange={setQuery}
            onSend={() => onSend?.(query)}
          />
        </div>
        <p className="chat__disclaimer">
          SitePilot can make mistakes. Check important info.
        </p>
      </footer>
    </main>
  );
}
