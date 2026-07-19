import { getStudioRelease } from "@/app/shell/studioRelease";

/**
 * Sticky right chip on the page-tabs row — version + channel.
 * Must win over overflowing tabs (flex-shrink 0 + solid fill + z-index).
 */
export function StudioNavVersionChip() {
  const release = getStudioRelease();

  return (
    <div
      className="studio-nav-version"
      data-studio-version={release.version}
      data-studio-channel={release.channel}
      title={`UX Studio ${release.label} (${release.channel})`}
      aria-label={`UX Studio ${release.label}, ${release.channel} channel`}
    >
      <span className="studio-nav-version__semver">{release.label}</span>
      <span
        className={`studio-nav-version__channel studio-nav-version__channel--${release.channel}`}
      >
        {release.channel}
      </span>
    </div>
  );
}
