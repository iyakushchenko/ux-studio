export {
  PROTO_HUB_LABEL,
  PROTO_INDEX_APPOINTMENT_DETAILS,
  PROTO_INDEX_APPOINTMENT_HISTORY,
  PROTO_INDEX_PLP,
  PROTO_SCREENS,
  protoNavIndex,
  protoTabToIndex,
  type ProtoScreen,
} from "@/projects/puma/screens/protoScreens";

export { PROTO_SCENARIO_SCREENS } from "@/projects/puma/screens/protoScreens";

export function ProjectFrame() {
  return (
    <div
      className="flex flex-1 min-h-0 items-center justify-center bg-neutral-100 text-neutral-600"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      <p className="text-sm font-semibold uppercase tracking-wide">
        Puma prototype — coming soon
      </p>
    </div>
  );
}

export function ProtoHubViewport(_props: { onGoToTab?: (index: number) => void }) {
  return (
    <div className="p-8 text-center text-neutral-600">
      <p className="text-lg font-semibold">Puma</p>
      <p className="mt-2 text-sm">Project shell registered. Content not wired yet.</p>
    </div>
  );
}
