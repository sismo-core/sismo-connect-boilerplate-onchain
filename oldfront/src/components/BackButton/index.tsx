import Link from "next/link";

export default function BackButton() {
  return (
    <Link href="/" className="back-button">
      ← Back Home
    </Link>
  );
}
