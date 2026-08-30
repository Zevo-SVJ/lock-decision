import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { Close } from "@/components/landing/Close";
import { Depth } from "@/components/landing/Depth";
import { Hero } from "@/components/landing/Hero";
import { Mechanism } from "@/components/landing/Mechanism";
import { Nav } from "@/components/landing/Nav";
import { Relay } from "@/components/landing/Relay";
import { Result } from "@/components/landing/Result";
import { Statement } from "@/components/landing/Statement";
import { INVITE_PARAM } from "@/lib/lock-invite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock — make a decision, lock it" },
      {
        name: "description",
        content:
          "Bring the thing you keep going round. Lock works out what it actually turns on, then hands you the one move that ends it.",
      },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "Make a decision. Lock it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#08080a" },
    ],
  }),
  // An invitation must never land on marketing. Links built before the product
  // moved to /lock still point here, so they are forwarded intact.
  beforeLoad: ({ location }) => {
    const invite = (location.search as Record<string, unknown>)[INVITE_PARAM];
    if (typeof invite === "string" && invite) {
      throw redirect({ href: `/lock?${INVITE_PARAM}=${encodeURIComponent(invite)}` });
    }
  },
  component: Landing,
});

/**
 * The landing page.
 *
 * Five scenes and a way in. Each one holds a single idea and a single object,
 * and the objects are real product surfaces rather than pictures of them.
 *
 * Nothing on this page plays at the visitor. The only motion is the control
 * they drive themselves and a heading that comes up to full strength as it is
 * reached — everything else is composition, which is what lets the page be
 * quiet enough to read as expensive.
 */
function Landing() {
  const navigate = useNavigate();
  const start = () => void navigate({ to: "/lock" });

  return (
    <>
      <div className="lock-ground" aria-hidden="true" />

      <div className="page">
        <Nav onStart={start} />

        <main>
          <Hero onStart={start} />

          {/* The mechanism, on a surface lifted just off the ground. */}
          <section className="scene scene--lifted">
            <div className="wrap">
              <Statement lead="You bring a decision." rest="You leave with one." />
              <Mechanism />
            </div>
          </section>

          <section className="scene">
            <div className="wrap">
              <Statement lead="Some decisions take seconds." rest="Some take longer." />
              <p className="scene-note">
                Lock goes as far as the decision needs and stops. It never pads out an easy call to
                look thorough, and it never leaves a hard one half open.
              </p>
              <Depth />
            </div>
          </section>

          {/* The social act, on the deepest ground on the page. */}
          <section className="scene scene--deep">
            <div className="wrap">
              <Statement lead="Some decisions are better" rest="with someone else." />
              <p className="scene-note scene-note--lead">
                Send the decision. Not the conversation.
              </p>
              <Relay />
            </div>
          </section>

          <section className="scene scene--tight">
            <div className="wrap">
              <Statement lead="Every lock leaves" rest="one of these." />
              <p className="scene-note">
                The decision, sealed, with the moment you made it. Keep it, or put it somewhere
                people will ask about it.
              </p>
              <Result />
            </div>
          </section>
        </main>

        <Close onStart={start} />
      </div>
    </>
  );
}
