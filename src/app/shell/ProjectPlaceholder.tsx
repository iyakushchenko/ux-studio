type Props = {
  projectLabel: string;
};

/** Shown when a registered project has no wire component yet. */
export function ProjectPlaceholder({ projectLabel }: Props) {
  return (
    <div className="studio-app-content flex flex-1 min-h-0 w-full flex-col items-center justify-center gap-3 bg-white p-8 text-center">
      <p className="text-lg font-semibold text-[#012169]">{projectLabel}</p>
      <p className="max-w-md text-sm text-[#333]">
        This project is registered in the studio shell. Screen wiring and Figma export
        are not connected yet.
      </p>
    </div>
  );
}
