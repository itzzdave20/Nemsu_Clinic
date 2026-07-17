export default function NemsuLogo({ size = 'md', className = '', alt = 'NEMSU Official Seal' }) {
  const sizes = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <span className={`brand-mark ${sizes[size] || sizes.md} ${className}`}>
      <img src="/nemsu-logo.png" alt={alt} draggable={false} />
    </span>
  );
}
