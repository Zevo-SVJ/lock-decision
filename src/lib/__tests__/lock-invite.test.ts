import { describe, expect, test } from "bun:test";

import { buildInviteUrl, decodeInvite, encodeInvite } from "@/lib/lock-invite";

describe("invitations", () => {
  test("round-trips a decision", () => {
    const invite = { prompt: "Are you moving to Lisbon in March, or not?" };
    expect(decodeInvite(encodeInvite(invite))).toEqual(invite);
  });

  test("round-trips a signature", () => {
    const invite = { prompt: "Decide about the flat.", from: "Sam" };
    expect(decodeInvite(encodeInvite(invite))).toEqual(invite);
  });

  test("survives unicode", () => {
    const invite = { prompt: "Déménager à Lisbonne — oui ou non ?" };
    expect(decodeInvite(encodeInvite(invite))).toEqual(invite);
  });

  test("strips control characters and collapses whitespace", () => {
    const messy = ["Leave  the", "", " job  now"].join("\n");
    expect(decodeInvite(encodeInvite({ prompt: messy }))?.prompt).toBe("Leave the job now");
  });

  test("caps an overlong prompt", () => {
    const decoded = decodeInvite(encodeInvite({ prompt: "x".repeat(500) }));
    expect(decoded?.prompt.length).toBe(160);
  });

  test("rejects junk rather than throwing", () => {
    expect(decodeInvite("not base64 at all !!")).toBeNull();
    expect(decodeInvite("")).toBeNull();
    expect(decodeInvite(null)).toBeNull();
    expect(decodeInvite(btoa("[]"))).toBeNull();
    expect(decodeInvite(btoa('{"p":123}'))).toBeNull();
    expect(decodeInvite(btoa('{"p":"   "}'))).toBeNull();
  });

  test("builds a link that lands in the product and carries nothing else", () => {
    const url = buildInviteUrl("https://lock.app/somewhere?utm=x#frag", { prompt: "Decide." });
    const parsed = new URL(url);
    // An invitation must not drop someone on the marketing page.
    expect(parsed.pathname).toBe("/lock");
    expect(parsed.hash).toBe("");
    expect(parsed.searchParams.get("utm")).toBeNull();
    expect(decodeInvite(parsed.searchParams.get("k"))).toEqual({ prompt: "Decide." });
  });
});
