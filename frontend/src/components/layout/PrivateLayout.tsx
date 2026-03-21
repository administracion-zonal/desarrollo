import Navbar from "./Navbar";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default function PrivateLayout({ children }: Props) {
  return (
    <>
      <Navbar />
      <main style={{ padding: "20px" }}>{children}</main>
    </>
  );
}
