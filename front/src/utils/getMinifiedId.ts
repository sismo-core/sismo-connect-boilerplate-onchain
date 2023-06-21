export default function getMinifiedId(identifier: string | undefined) {
  if (identifier) {
    if (identifier.length <= 20) return identifier;
    const start = identifier?.slice(0, 6);
    const last = identifier?.slice(-4);
    return start + "..." + last;
  } else return "...";
}
