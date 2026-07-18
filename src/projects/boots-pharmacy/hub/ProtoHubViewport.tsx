import ProtoHubPage from "@/projects/boots-pharmacy/hub/ProtoHubPage";

type Props = {
  onGoToTab: (screenIndex: number) => void;
};

/** Hub wiki — always mounted; visibility toggled in App. */
export default function ProtoHubViewport({ onGoToTab }: Props) {
  return <ProtoHubPage onGoToTab={onGoToTab} />;
}
