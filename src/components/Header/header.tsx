interface HeaderProps {
  title: string;
  subtitle?: string;
}

function Header({ title, subtitle = '' }: HeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="text-3xl font-bold text-text pb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-md font-bold text-text-secondary text-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default Header;
