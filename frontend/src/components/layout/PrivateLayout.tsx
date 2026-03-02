import Navbar from "./Navbar";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main style={{ padding: "20px" }}>{children}</main>
    </>
  );
}
