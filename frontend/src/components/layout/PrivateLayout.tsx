import Navbar from "./Navbar";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default function PrivateLayout({ children }: Props) {
  return (
    <div className="private-layout">
      <Navbar />
      <main className="private-content">{children}</main>
    </div>
  );
}
