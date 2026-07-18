import type { HubExperienceDiagram } from "@/projects/boots-pharmacy/hub/protoHubContent";
import ProtoHubTabLink from "@/projects/boots-pharmacy/hub/ProtoHubTabLink";

type Props = {
  diagram: HubExperienceDiagram;
  onGoToTab: (screenIndex: number) => void;
};

function FlowNode({
  label,
  detail,
  protoTab,
  variant,
  onGoToTab,
}: {
  label: string;
  detail?: string;
  protoTab?: number;
  variant: "agentic" | "traditional" | "shared";
  onGoToTab: (screenIndex: number) => void;
}) {
  return (
    <div className={`proto-hub-flow__node proto-hub-flow__node--${variant}`}>
      <div className="proto-hub-flow__node-head">
        <span className="proto-hub-flow__node-label">{label}</span>
        {protoTab != null ? (
          <ProtoHubTabLink
            tab={protoTab}
            onGoToTab={onGoToTab}
            className="proto-hub-flow__node-tab proto-hub-tab-link proto-hub-tab-link--badge"
          >
            Tab {protoTab}
          </ProtoHubTabLink>
        ) : null}
      </div>
      {detail ? <p className="proto-hub-flow__node-detail">{detail}</p> : null}
    </div>
  );
}

export default function ProtoHubExperienceDiagram({
  diagram,
  onGoToTab,
}: Props) {
  return (
    <div
      className="proto-hub-flow"
      role="img"
      aria-label="Agentic versus traditional vaccination booking experience"
    >
      <div className="proto-hub-flow__intent">
        <p className="proto-hub-flow__intent-label">Persona intent</p>
        <p className="proto-hub-flow__intent-text">{diagram.intent}</p>
      </div>

      <div className="proto-hub-flow__split" aria-hidden>
        <span className="proto-hub-flow__split-line" />
        <span className="proto-hub-flow__split-fork" />
      </div>

      <div className="proto-hub-flow__lanes">
        {diagram.lanes.map((lane) => (
          <div
            key={lane.id}
            className={`proto-hub-flow__lane proto-hub-flow__lane--${lane.variant}`}
          >
            <header className="proto-hub-flow__lane-header">
              <h3 className="proto-hub-flow__lane-title">{lane.title}</h3>
              <p className="proto-hub-flow__lane-subtitle">{lane.subtitle}</p>
            </header>
            <div className="proto-hub-flow__lane-nodes">
              {lane.nodes.map((node, index) => (
                <div key={node.label} className="proto-hub-flow__lane-step">
                  {index > 0 ? (
                    <span className="proto-hub-flow__arrow" aria-hidden />
                  ) : null}
                  <FlowNode {...node} variant={lane.variant} onGoToTab={onGoToTab} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="proto-hub-flow__merge" aria-hidden>
        <span className="proto-hub-flow__merge-line" />
        <span className="proto-hub-flow__merge-chevron" />
      </div>

      <div className="proto-hub-flow__shared">
        <header className="proto-hub-flow__shared-header">
          <h3 className="proto-hub-flow__shared-title">{diagram.shared.title}</h3>
          <p className="proto-hub-flow__shared-subtitle">
            {diagram.shared.subtitle}
          </p>
        </header>
        <div className="proto-hub-flow__shared-nodes">
          {diagram.shared.nodes.map((node, index) => (
            <div key={node.label} className="proto-hub-flow__shared-step">
              {index > 0 ? (
                <span className="proto-hub-flow__arrow" aria-hidden />
              ) : null}
              <FlowNode {...node} variant="shared" onGoToTab={onGoToTab} />
            </div>
          ))}
        </div>
      </div>

      {diagram.notes?.length ? (
        <ul className="proto-hub-flow__notes">
          {diagram.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
