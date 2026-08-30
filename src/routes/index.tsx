import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { Artifact } from "@/components/landing/Artifact";
import { Convergence } from "@/components/landing/Convergence";
import { Faq } from "@/components/landing/Faq";
import { Final } from "@/components/landing/Final";
import { Handoff } from "@/components/landing/Handoff";
import { Hero } from "@/components/landing/Hero";
import { Nav } from "@/components/landing/Nav";
import { Section } from "@/components/landing/Section";
import { Sequence } from "@/components/landing/Sequence";
import { INVITE_PARAM } from "@/lib/lock-invite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock — finish the decision" },
      {
        name: "description",
        content:
          "Lock works out what you are actually deciding, then gives you one deliberate way to close it.",
      },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "Finish the decision." },
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
 * Six things, in the order they earn each other: the gesture, the mechanism,
 * the plain claim, the fact that it always ends, the person you can hand it
 * to, and what you keep. The page alternates motion and stillness on purpose —
 * only the sequence and the two locks move, and everything between them holds
 * completely still so that they read as events.
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

          {/* Motion. The one long-form thing on the page. */}
          <Sequence />

          {/* Stillness. The plain claim, once they have watched it happen. */}
          <Section
            eyebrow="What it is"
            title="A place to finish a decision."
            lead="Not somewhere to think out loud. Lock takes the thing you have been going round, works out what it actually turns on, and hands you the one move that ends it."
          />

          <Section
            eyebrow="Depth"
            title="Two minutes or twenty. It still ends."
            lead="An easy call is not padded out to look thorough, and a hard one is not cut short. What does not change is that there is a bottom to it."
            wide
          >
            <Convergence />
          </Section>

          <Section
            eyebrow="Together"
            title="Some decisions are not yours alone."
            lead="Hand one over the way you would send a message. They open Lock already holding it — and what they answer stays theirs."
            wide
          >
            <Handoff />
          </Section>

          <Section
            eyebrow="What you keep"
            title="Every lock leaves one of these."
            lead="The decision, why it held, and the moment you made it. Yours to keep, or to put somewhere people will ask about it."
          >
            <Artifact />
          </Section>

          <Section eyebrow="Before you start" title="Straight answers.">
            <Faq />
          </Section>

          {/* Motion, once more, and then nothing. */}
          <Final onStart={start} />
        </main>
      </div>
    </>
  );
}
