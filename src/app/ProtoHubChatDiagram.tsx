import type { HubChatDiagram } from "@/app/protoHubContent";
import ProtoHubTabLink from "@/app/ProtoHubTabLink";

type Props = {
  diagram: HubChatDiagram;
  onGoToTab: (screenIndex: number) => void;
};

function ActionPill({
  action,
  onGoToTab,
}: {
  action: NonNullable<HubChatDiagram["turns"][0]["actions"]>[0];
  onGoToTab: (screenIndex: number) => void;
}) {
  return (
    <div className={`proto-hub-chat__action proto-hub-chat__action--${action.variant}`}>
      <div className="proto-hub-chat__action-head">
        <span className="proto-hub-chat__action-label">{action.label}</span>
        {action.protoTab != null ? (
          <ProtoHubTabLink
            tab={action.protoTab}
            onGoToTab={onGoToTab}
            className="proto-hub-flow__node-tab proto-hub-tab-link proto-hub-tab-link--badge"
          >
            Tab {action.protoTab}
          </ProtoHubTabLink>
        ) : null}
      </div>
      <p className="proto-hub-chat__action-outcome">{action.outcome}</p>
    </div>
  );
}

export default function ProtoHubChatDiagram({ diagram, onGoToTab }: Props) {
  return (
    <div className="proto-hub-chat" aria-labelledby="proto-hub-chat-title">
      <div className="proto-hub-chat__header">
        <h3 id="proto-hub-chat-title" className="proto-hub-page__h3">
          {diagram.title}
        </h3>
        <p className="proto-hub-page__p">{diagram.intro}</p>
        <div className="proto-hub-chat__open">
          <ProtoHubTabLink
            tab={diagram.protoTab}
            onGoToTab={onGoToTab}
            className="proto-hub-chat__open-btn"
          >
            Open tab {diagram.protoTab} to walk this conversation live
          </ProtoHubTabLink>
        </div>
      </div>

      <div className="proto-hub-chat__entry">
        <p className="proto-hub-chat__entry-label">Tab 1 · Home entry</p>
        <div className="proto-hub-chat__bubble proto-hub-chat__bubble--user">
          <p className="proto-hub-chat__bubble-text">{diagram.home.query}</p>
        </div>
        <div className="proto-hub-chat__chips">
          {diagram.home.suggestedChips.map((chip) => (
            <span key={chip} className="proto-hub-chat__chip">
              {chip}
            </span>
          ))}
        </div>
        <p className="proto-hub-chat__entry-note">{diagram.home.sendAction}</p>
        <span className="proto-hub-chat__down-arrow" aria-hidden />
      </div>

      <div className="proto-hub-chat__thread">
        {diagram.turns.map((turn) => (
          <article key={turn.turn} className="proto-hub-chat__turn">
            <header className="proto-hub-chat__turn-header">
              <span className="proto-hub-chat__turn-num">Turn {turn.turn}</span>
            </header>

            <div className="proto-hub-chat__bubble proto-hub-chat__bubble--user">
              <p className="proto-hub-chat__bubble-label">Sarah</p>
              <p className="proto-hub-chat__bubble-text">{turn.user}</p>
            </div>

            <span className="proto-hub-chat__connector" aria-hidden />

            <div className="proto-hub-chat__bubble proto-hub-chat__bubble--assistant">
              <p className="proto-hub-chat__bubble-label">SitePilot</p>
              <p className="proto-hub-chat__bubble-text">{turn.assistantSummary}</p>
              {turn.assistantDetails?.map((detail) => (
                <p key={detail} className="proto-hub-chat__bubble-detail">
                  {detail}
                </p>
              ))}
            </div>

            {turn.actions?.length ? (
              <div className="proto-hub-chat__actions">
                <p className="proto-hub-chat__actions-label">Next steps in UI</p>
                <div className="proto-hub-chat__actions-grid">
                  {turn.actions.map((action) => (
                    <ActionPill
                      key={action.label}
                      action={action}
                      onGoToTab={onGoToTab}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="proto-hub-chat__composer">
        <p className="proto-hub-chat__composer-label">Persistent composer (tab 2)</p>
        <div className="proto-hub-chat__composer-box">
          <span className="proto-hub-chat__composer-placeholder">
            {diagram.composer.placeholder}
          </span>
        </div>
        <div className="proto-hub-chat__chips">
          {diagram.composer.nextDialogChips.map((chip) => (
            <span key={chip} className="proto-hub-chat__chip">
              {chip}
            </span>
          ))}
        </div>
        <p className="proto-hub-chat__composer-note">{diagram.composer.chipBehavior}</p>
      </div>

      <div className="proto-hub-chat__patterns">
        <h4 className="proto-hub-chat__patterns-title">Design patterns</h4>
        <dl className="proto-hub-chat__patterns-list">
          {diagram.patterns.map((pattern) => (
            <div key={pattern.title} className="proto-hub-chat__pattern">
              <dt>{pattern.title}</dt>
              <dd>{pattern.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
