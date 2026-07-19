/**
 * Shared Site Pilot composer — Home + Chat Make-identical query row / mic / send.
 * `data-studio-action` ids differ by surface (recording / MCP).
 */

export const SITE_PILOT_QUERY_LINE_PX = 24;
export const SITE_PILOT_QUERY_MAX_LINES = 5;

export type SitePilotComposerSurface = "home" | "chat";

export function sitePilotQueryAction(surface: SitePilotComposerSurface): string {
  return surface === "home" ? "agentic-home-query" : "agentic-chat-query";
}

export function sitePilotMicAction(surface: SitePilotComposerSurface): string {
  return surface === "home" ? "agentic-home-mic" : "agentic-chat-mic";
}

export function sitePilotSendAction(surface: SitePilotComposerSurface): string {
  return surface === "home" ? "agentic-home-send" : "agentic-chat-send";
}

export const SITE_PILOT_HOME_QUERY_PLACEHOLDER = "Ask about health services…";
export const SITE_PILOT_CHAT_QUERY_PLACEHOLDER = "Ask Boots SitePilot";

export function sitePilotQueryPlaceholder(surface: SitePilotComposerSurface): string {
  return surface === "home"
    ? SITE_PILOT_HOME_QUERY_PLACEHOLDER
    : SITE_PILOT_CHAT_QUERY_PLACEHOLDER;
}

export function sitePilotQueryAriaLabel(surface: SitePilotComposerSurface): string {
  return surface === "home" ? "Ask Site Pilot" : "Ask Boots SitePilot";
}
