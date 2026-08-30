import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { Card } from "@/components/landing/Card";
import { Close } from "@/components/landing/Close";
import { Handoff } from "@/components/landing/Handoff";
import { Hero } from "@/components/landing/Hero";
import { Nav } from "@/components/landing/Nav";
import { Converge } from "@/components/landing/Plainly";
import { Section } from "@/components/landing/Section";
import { Stages } from "@/components/landing/Stages";
import { Story } from "@/components/landing/Story";
import { Weight } from "@/components/landing/Weight";
import { INVITE_PARAM } from "@/lib/lock-invite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock — decide it, lock it" },
      {
        name: "description",
        content: "Lock turns the thing you keep going round into a decision you can close.",
      },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "Decide it. Lock it." },
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
 * Two things move on it: the story, which plays itself, and the lock, which
 * the visitor moves. Everything between them is completely still — that
 * contrast is the rhythm, and it is why the two moving things register as
 * events rather than as decoration.
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

          {/* Motion. The one long-form thing on the page, and it plays itself. */}
          <Story />

          {/* Stillness, from here to the last screen. */}
          <Section
            eyebrow="What it is"
            title="You bring a decision. You leave without it."
            lead="Not somewhere to think out loud. Lock takes what you have been going round, works out what it actually turns on, and hands you the one move that ends it."
          >
            <Converge />
          </Section>

          <Section eyebrow="How it goes" title="Three moves, and it is done." wide>
            <Stages />
          </Section>

          <Section
            eyebrow="How far it goes"
            title="It stops when you are done, not when the script is."
            lead="A decision that is nearly made gets a short run at it. One that is genuinely open gets a longer one. The gesture at the end is the same either way."
            wide
          >
            <Weight />
          </Section>

          <Section
            eyebrow="Together"
            title="Some decisions are better with someone else."
            lead="Send the decision, not the conversation. They open Lock already holding it, and what they answer stays theirs."
            wide
          >
            <p className="pull">Lock someone else.</p>
            <Handoff />
          </Section>

          <Section
            eyebrow="Afterwards"
            title="One image. The decision, and the moment you made it."
            lead="Every lock leaves one. Keep it, or put it somewhere people will ask about it."
          >
            <Card />
          </Section>
        </main>

        <Close onStart={start} />
      </div>
    </>
  );
}
