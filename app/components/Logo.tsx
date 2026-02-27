import { Link } from "@remix-run/react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  linkTo?: string;
}

const Logo = ({ size = "md", linkTo = "/" }: LogoProps) => {
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };
  const subSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  const content = (
    <div className="flex flex-col">
      <span className={`${textSizes[size]} text-[#0B1B3D] tracking-tight`}>
        <span className="font-bold">Requity</span>{" "}
        <span className="font-light">Lending</span>
      </span>
      <span className={`${subSizes[size]} text-[#64748B] tracking-widest uppercase -mt-1`}>
        A Requity Group Company
      </span>
    </div>
  );

  return (
    <Link to={linkTo} className="inline-flex">
      {content}
    </Link>
  );
};
export default Logo;
