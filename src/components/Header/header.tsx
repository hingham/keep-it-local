interface HeaderProps {
  title: string;
  subtitle?: string;
}

function Header({ title, subtitle = '' }: HeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold text-text">
        {title}
      </h1>
      {subtitle && (
        <p className="text-md text-text-secondary">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default Header;
