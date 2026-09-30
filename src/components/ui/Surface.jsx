export default function Surface({ as: Element = 'section', className = '', children }) {
  return <Element className={`ui-surface ${className}`.trim()}>{children}</Element>;
}
