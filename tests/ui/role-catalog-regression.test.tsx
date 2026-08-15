import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PermisosPage from "@/app/(dashboard)/permisos/page";

describe("catálogo de roles en la interfaz", () => {
  afterEach(cleanup);

  it("muestra EJECUTIVO y no ofrece roles eliminados", () => {
    render(<PermisosPage />);

    expect(screen.queryByText("Gerente")).toBeNull();
    expect(screen.queryByText("Visor")).toBeNull();
    expect(screen.getByText("Ejecutivo")).toBeTruthy();
  });
});
