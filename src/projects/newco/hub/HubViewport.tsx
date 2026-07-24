import HubPage from "@/projects/newco/hub/HubPage";

type Props = {
  onGoToTab: (screenIndex: number) => void;
};

/** Hub wiki — always mounted; visibility toggled by NewCoProjectView. */
export default function HubViewport({ onGoToTab }: Props) {
  return <HubPage onGoToTab={onGoToTab} />;
}
