interface HeaderProps {
  title: string;
  subtitle: string;
}

function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-text mb-2">
        {title}
      </h1>
      <p className="text-lg text-text-secondary">
        {subtitle}
      </p>
    </div>
  );
}

export default Header;
