import { fetchWithFallback, hasArrays } from "./client";

type Data = { items: string[] };
const fallback: Data = { items: ["fixture"] };
const isData = (v: unknown): v is Data => hasArrays(v, "items");

const mockFetch = (impl: () => Promise<Partial<Response>>) => {
  (globalThis as { fetch: unknown }).fetch = jest.fn(impl);
};

describe("fetchWithFallback", () => {
  it("returns the fixture when no base URL is set", async () => {
    const r = await fetchWithFallback("/x", fallback, isData, null);
    expect(r.origin).toBe("fixture");
    expect(r.data).toBe(fallback);
  });

  it("returns server data when the response is valid", async () => {
    mockFetch(async () => ({
      ok: true,
      json: async () => ({ items: ["server"] }),
    }));
    const r = await fetchWithFallback("/x", fallback, isData, "http://s");
    expect(r.origin).toBe("server");
    expect(r.data.items).toEqual(["server"]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://s/x",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("falls back on a non-2xx status", async () => {
    mockFetch(async () => ({ ok: false, json: async () => ({}) }));
    const r = await fetchWithFallback("/x", fallback, isData, "http://s");
    expect(r.origin).toBe("fixture");
  });

  it("falls back when the shape is wrong", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ items: "no" }) }));
    const r = await fetchWithFallback("/x", fallback, isData, "http://s");
    expect(r.origin).toBe("fixture");
  });

  it("falls back when fetch throws", async () => {
    mockFetch(async () => {
      throw new Error("offline");
    });
    const r = await fetchWithFallback("/x", fallback, isData, "http://s");
    expect(r.origin).toBe("fixture");
  });
});

describe("hasArrays", () => {
  it("checks every named key is an array", () => {
    expect(hasArrays({ a: [], b: [1] }, "a", "b")).toBe(true);
    expect(hasArrays({ a: [] }, "a", "b")).toBe(false);
    expect(hasArrays([], "a")).toBe(false);
    expect(hasArrays(null, "a")).toBe(false);
  });
});
