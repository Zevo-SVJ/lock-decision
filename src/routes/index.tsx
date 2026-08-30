import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Depth } from "@/components/landing/Depth";
import { HeroLock } from "@/components/landing/HeroLock";
import { NotAChat } from "@/components/landing/NotAChat";
import { Relay } from "@/components/landing/Relay";
import { Scene } from "@/components/landing/Scene";
import { LockMark } from "@/components/lock/LockMark";
import { SlideToLock } from "@/components/SlideToLock";
import { INVITE_PARAM } from "@/lib/lock-invite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock" },
      {
        name: "description",
        content: "You already know. Lock is where you say it.",
      },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "You already know. You just haven't decided." },
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

function Landing() {
  const navigate = useNavigate();
  const [locked, setLocked] = useState(false);

  return (
    <>
      <div className="lock-ground" aria-hidden="true" />

      <main className="landing">
        <header className="landing-chrome">
          <LockMark progress={locked ? 1 : 0} />
        </header>

        <section className="hero">
          <h1 className="hero-title">
            You already know.
            <span className="hero-title-dim"> You just haven&rsquo;t decided.</span>
          </h1>

          <HeroLock onLocked={() => setLocked(true)} />

          <p className="hero-after" data-shown={locked || undefined} aria-live="polite">
            That is the whole product. Everything before it exists to get you here.
          </p>
        </section>

        <Scene
          eyebrow="What it is"
          title={
            <>
              A decision instrument.
              <span className="scene-title-dim"> Not somebody to talk to.</span>
            </>
          }
        >
          <p className="scene-body">
            Lock does not interview you. It works out what the decision is actually about, shows
            you, and asks for a commitment.
          </p>
          <NotAChat />
        </Scene>

        <Scene
          eyebrow="How long it takes"
          title={
            <>
              As long as the decision deserves.
              <span className="scene-title-dim"> No longer.</span>
            </>
          }
        >
          <p className="scene-body">
            An easy call is one exchange. A hard one opens up. You are never walked through a
            questionnaire that was written before it met you.
          </p>
          <Depth />
        </Scene>

        <Scene
          eyebrow="When it is not yours alone"
          title={
            <>
              Hand it to someone else.
              <span className="scene-title-dim"> Let them lock it.</span>
            </>
          }
        >
          <p className="scene-body">
            Send a decision the way you would send a message. They open Lock already holding it, and
            what they answer stays theirs.
          </p>
          <Relay />
        </Scene>

        <section className="closing">
          <p className="closing-line">Something is waiting on you.</p>
          <SlideToLock
            label="slide to begin"
            confirmedLabel="open"
            onConfirm={() => void navigate({ to: "/lock" })}
          />
          <button
            type="button"
            onClick={() => void navigate({ to: "/lock" })}
            className="closing-plain"
          >
            Or just start
          </button>
        </section>
      </main>
    </>
  );
}
