import React, { useEffect } from "react";

export default function useClickOutside(
  ref: React.MutableRefObject<HTMLElement> | React.MutableRefObject<null>,
  outsideClickCallback: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (!ref) return;

      if (
        event.type === "mousedown" &&
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        outsideClickCallback();
      }
      if (
        event.type === "keydown" &&
        event.code === "Escape" &&
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        outsideClickCallback();
      }
    }
    document.addEventListener("keydown", handleClickOutside);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, outsideClickCallback]);
}