

export default function VisitorCounter({ count }: { count: number | null }) {
  if (count === null) return <span className="visitor-count">Visitor: ---</span>;

  return (
    <span className="visitor-count" title="Total Visitor">
      Visitor: {count.toLocaleString()}
    </span>
  );
}
