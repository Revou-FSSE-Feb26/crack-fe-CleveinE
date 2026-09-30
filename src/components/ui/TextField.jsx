export default function TextField({ label, id, className = '', ...props }) {
  return <label className={`ui-field ${className}`.trim()} htmlFor={id}>{label}<input id={id} {...props} /></label>;
}
