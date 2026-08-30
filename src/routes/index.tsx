import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { Benefits } from "@/components/landing/Benefits";
import { Commit } from "@/components/landing/Commit";
import { Depth } from "@/components/landing/Depth";
import { Faq } from "@/components/landing/Faq";
import { Hero } from "@/components/landing/Hero";
import { Narrowing } from "@/components/landing/Narrowing";
import { Nav } from "@/components/landing/Nav";
import { Pricing } from "@/components/landing/Pricing";
import { Circling } from "@/components/landing/Problem";
import { Relay } from "@/components/landing/Relay";
import { Section } from "@/components/landing/Section";
import { INVITE_PARAM } from "@/lib/lock-invite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock — make the decision you keep putting off" },
      {
        name: "description",
        content:
          "Say what you are stuck on. Lock finds the real decision under it, then gives you one deliberate action to commit to it.",
      },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "Make the decision you keep putting off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b0b0d" },
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
 * The order is the order of a stranger's questions: what is this, does it
 * work, why would I need it, how does it go, what does it cost. The page gets
 * quieter as it goes — the noisiest thing on it is the decision at the top and
 * the emptiest is the lock at the bottom.
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

          <Section
            eyebrow="Why"
            title="You usually have enough information. You just have not decided."
            lead="Going round it again does not add anything. It only costs you the week."
          >
            <Circling />
          </Section>

          {/* The one animated thing on the page. It resolves to a decision — */}
          <Section eyebrow="How it works" title="Watch one decision get smaller." flush />
          <Narrowing />
          {/* — and the next section locks that exact decision. */}
          <Commit />

          <Section eyebrow="What you get" title="Three things Lock is for." wide>
            <Benefits />
          </Section>

          <Section
            eyebrow="Depth"
            title="Not every decision deserves the same amount of work."
            lead="It is not twenty questions. Lock does not put an easy call through a long process just to look thorough."
            wide
          >
            <Depth />
          </Section>

          <Section
            eyebrow="Together"
            title="Some decisions are not yours alone."
            lead="Send one the way you would send a message. They open Lock already holding it, and what they answer stays theirs."
            wide
          >
            <Relay />
          </Section>

          <Section eyebrow="Price" title="Free, for now." wide>
            <Pricing onStart={start} />
          </Section>

          <Section eyebrow="Before you start" title="Straight answers.">
            <Faq />
          </Section>

          <section className="final">
            <p className="final-line">Stop circling it.</p>
            <button type="button" onClick={start} className="btn btn--primary final-cta">
              Try Lock
            </button>
          </section>
        </main>
      </div>
    </>
  );
}
