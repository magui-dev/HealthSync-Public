import { useRef, useEffect, useState } from "react";

export default function DropdownMenu({ button, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const handleButtonClick = () => setOpen((v) => !v);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <span onClick={handleButtonClick} style={{ cursor: "pointer" }}>
        {button}
      </span>
      {open && (
        <div id="dropdownMenu">
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}