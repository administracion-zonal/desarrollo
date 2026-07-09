type Props = Readonly<{
  children: React.ReactNode;
}>;

export default function PrivateLayout({ children }: Props) {
  return (
    <main className="private-layout">
      <section className="page-shell">{children}</section>
    </main>
  );
}
