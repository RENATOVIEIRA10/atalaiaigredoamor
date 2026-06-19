import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedContext = vi.hoisted(() => ({
  campo: {
    activeCampoId: null as string | null,
    isGlobalView: false,
  },
  role: {
    isPastorSeniorGlobal: false,
    isAdmin: false,
  },
}));

vi.mock("@/contexts/CampoContext", () => ({
  useCampo: () => mockedContext.campo,
}));

vi.mock("@/contexts/RoleContext", () => ({
  useRole: () => mockedContext.role,
}));

import { useCampoFilter, useCampoFilterDetailed } from "@/hooks/useCampoFilter";

const CAMPO_ID = "11111111-1111-4111-8111-111111111111";

describe("useCampoFilter", () => {
  beforeEach(() => {
    mockedContext.campo.activeCampoId = null;
    mockedContext.campo.isGlobalView = false;
    mockedContext.role.isPastorSeniorGlobal = false;
    mockedContext.role.isAdmin = false;
  });

  it("returns the active campo for local scoped users", () => {
    mockedContext.campo.activeCampoId = CAMPO_ID;

    const { result } = renderHook(() => useCampoFilter());

    expect(result.current).toBe(CAMPO_ID);
  });

  it("allows null campo only for authorized global view", () => {
    mockedContext.campo.activeCampoId = CAMPO_ID;
    mockedContext.campo.isGlobalView = true;
    mockedContext.role.isPastorSeniorGlobal = true;

    const { result } = renderHook(() => useCampoFilterDetailed());

    expect(result.current).toEqual({
      campoId: null,
      isGlobal: true,
      isMissingCampo: false,
    });
  });

  it("does not grant global view to a local user just because the flag is set", () => {
    mockedContext.campo.activeCampoId = CAMPO_ID;
    mockedContext.campo.isGlobalView = true;

    const { result } = renderHook(() => useCampoFilterDetailed());

    expect(result.current).toEqual({
      campoId: CAMPO_ID,
      isGlobal: false,
      isMissingCampo: false,
    });
  });

  it("reports missing campo for non-global scoped users", () => {
    const { result } = renderHook(() => useCampoFilterDetailed());

    expect(result.current).toEqual({
      campoId: null,
      isGlobal: false,
      isMissingCampo: true,
    });
  });

  it("allows admin global view", () => {
    mockedContext.campo.isGlobalView = true;
    mockedContext.role.isAdmin = true;

    const { result } = renderHook(() => useCampoFilterDetailed());

    expect(result.current).toEqual({
      campoId: null,
      isGlobal: true,
      isMissingCampo: false,
    });
  });
});
