import "./Center.css";


export default function Center({
  className, children,
}: CenterProps) {
  return (
    <div className={["app-flex-center", className].join(" ")}>
      {children}
    </div>
  );
}
export type CenterProps = React.ComponentPropsWithRef<"div">
