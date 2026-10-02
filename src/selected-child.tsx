import { createContext, ReactNode, useContext, useState } from "react";

type Ctx = {
  selectedChildId: number | null;
  setSelectedChildId: (id: number | null) => void;
};
const SelectedChildContext = createContext<Ctx | null>(null);

export function SelectedChildProvider({ children }: { children: ReactNode }) {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  return (
    <SelectedChildContext.Provider
      value={{ selectedChildId, setSelectedChildId }}
    >
      {children}
    </SelectedChildContext.Provider>
  );
}

export function useSelectedChild() {
  const ctx = useContext(SelectedChildContext);
  if (!ctx)
    throw new Error(
      "useSelectedChild must be used inside SelectedChildProvider",
    );
  return ctx;
}
