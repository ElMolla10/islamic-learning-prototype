import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>;
}

export const BookIcon = (props: IconProps) => <Icon {...props}><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22Z"/><path d="M4 5.5v13A3.5 3.5 0 0 1 7.5 15H20"/></Icon>;
export const ArrowIcon = (props: IconProps) => <Icon {...props}><path d="m9 18 6-6-6-6"/></Icon>;
export const SourceIcon = (props: IconProps) => <Icon {...props}><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></Icon>;
export const CloseIcon = (props: IconProps) => <Icon {...props}><path d="m6 6 12 12M18 6 6 18"/></Icon>;
export const CheckIcon = (props: IconProps) => <Icon {...props}><path d="m5 12 4 4L19 6"/></Icon>;
export const ResetIcon = (props: IconProps) => <Icon {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></Icon>;
export const MenuIcon = (props: IconProps) => <Icon {...props}><path d="M4 7h16M4 12h16M4 17h16"/></Icon>;
export const ChevronDownIcon = (props: IconProps) => <Icon {...props}><path d="m6 9 6 6 6-6"/></Icon>;
export const MoveUpIcon = (props: IconProps) => <Icon {...props}><path d="m12 19V5M6 11l6-6 6 6"/></Icon>;
export const MoveDownIcon = (props: IconProps) => <Icon {...props}><path d="M12 5v14M18 13l-6 6-6-6"/></Icon>;
export const MapIcon = (props: IconProps) => <Icon {...props}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></Icon>;
export const UsersIcon = (props: IconProps) => <Icon {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
