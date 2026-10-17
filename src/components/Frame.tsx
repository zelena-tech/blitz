export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="canvas">
      <div className="frame">{children}</div>
    </main>
  );
}
