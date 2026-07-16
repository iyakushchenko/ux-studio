type Props = {
  className?: string;
};

/** UX DPT hub mark — from ux-dpt-logo.svg (teal tile + white glyph). */
export function ProtoNavLogo({ className }: Props) {
  return (
    <svg
      className={className ? `proto-nav-logo__svg ${className}` : "proto-nav-logo__svg"}
      width={20}
      height={20}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="80" height="80" rx="8" fill="#467672" />
      <path
        d="M67.9539 51.3543L40.0994 67.1277L39.144 66.591L13.0441 52.0128L12.0469 51.4533V12.8878L40.088 31.3446L67.9539 12.8726V51.3543ZM23.7018 49.2076L40.088 58.2932L56.3219 49.2076L40.088 40.2704L23.7018 49.2076ZM19.6595 42.7559L32.6961 35.6571L19.6595 27.0054V42.7559ZM47.4684 35.6609L60.3413 42.7407V27.1005L47.4684 35.6609Z"
        fill="white"
      />
    </svg>
  );
}
