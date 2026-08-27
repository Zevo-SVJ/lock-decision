# Lock Decision

Build a functional MVP of Lock, an AI-powered decision and commitment experience.

The MVP must have a real frontend, real AI, and especially a high-quality slide-to-confirm interaction. The slide-to-confirm is the CORE interaction of Lock and must receive more attention than any other UI element.

PRODUCT CONCEPT

Lock helps a user make a decision and commit to it.

The experience is:

Decision → reflection → AI questions → commitment → physical slide-to-confirm → locked decision

The product should feel like a focused premium iOS experience, not a generic SaaS website or chatbot.

Mobile/iPhone is the primary target.



1. FRONTEND

Create a minimal but polished Lock MVP.

Include:

Lock branding

simple intro screen

“Begin” CTA

one question at a time

AI-generated follow-up questions

clean conversation/journey interface

visible progress

final commitment screen

completion/result screen

Keep the UI minimal.

Do NOT build a large marketing website, dashboard, authentication system, payments, analytics or unnecessary features.

The core product experience matters most.



2. THE CORE: SLIDE TO CONFIRM

The final commitment interaction must be inspired very strongly by the familiar iPhone system interactions such as:

iPhone “Slide to Power Off”

“Slide to Answer” on the locked incoming-call screen

other native iOS slide-to-confirm interactions

The goal is NOT to copy Apple’s exact assets or branding.

The goal is to recreate the same interaction model, physical feeling and familiarity.

The screenshot provided with this prompt is the visual reference for the interaction.

IMPORTANT: THIS MUST BE A REAL DRAG INTERACTION

Do NOT implement this as:

a button

a simple click

a tap anywhere on the slider

a “drag and instantly confirm” interaction

a fake animation that automatically completes

The user must physically control the thumb with their finger.

Required behavior

The slider starts at the far left.

The user places their thumb/finger on the slider thumb and drags horizontally.

While the finger is still touching the screen:

the thumb follows the finger continuously

the thumb can stop at ANY point

the filled/active portion follows the thumb

the user can move forward

the user can move backward

the user can change direction

the user can hold the thumb at 20%, 50%, 80%, etc.

nothing is confirmed until the thumb reaches the required endpoint

If the user drags to 50%, holds, then moves back to 20%, the slider must visibly return to 20%.

If the user releases before reaching the endpoint:

DO NOT confirm

smoothly return the thumb to the starting position

reset the progress/filled track

allow the user to try again

Only when the thumb reaches the final threshold near 100% should Lock confirm the commitment.

At that exact moment:

trigger a clear completion animation

transition into the locked/confirmed state

then continue to the result screen

The interaction must feel physical and responsive.



3. SLIDER VISUAL DESIGN

Make it visually inspired by the iPhone’s “Slide to Power Off” / “Slide to Answer” interaction.

Structure:

wide horizontal rounded capsule

dark/neutral background matching Lock

large circular thumb

thumb visually separated from the track

centered instruction such as “Slide to Lock”

instruction remains visually clear while the thumb moves

subtle feedback as the thumb progresses

polished shadows/highlights

smooth native-feeling motion

The thumb should be large enough to comfortably control with a thumb on an iPhone.

The slider should occupy a substantial portion of the screen width.

Do NOT make it look like a standard web form slider.

It should feel like a system interaction.

The user should immediately understand:

“I need to physically drag this all the way.”



4. SLIDER PHYSICS

Prioritize touch interaction over mouse interaction.

Use proper pointer/touch events and pointer capture so the interaction remains stable if the user’s finger moves quickly.

The thumb must follow the user’s finger continuously.

Clamp the thumb position between 0% and 100%.

Do not allow the thumb to move outside the track.

The interaction must work correctly on iPhone Safari.

Use smooth but restrained motion.

Do NOT make the thumb lag noticeably behind the finger.

Do NOT automatically snap to 100% when the user gets close.

Only reaching the actual completion threshold should confirm.

If the user releases early, animate the thumb back to 0%.

The reset should feel similar to a native iOS control.



5. LOCK CONFIRMATION ANIMATION

When the thumb reaches 100%:

Complete the slider.

Give a subtle haptic-like visual feedback if actual haptics are unavailable.

Change the visual state to confirmed.

Briefly communicate that the decision is locked.

Transition to the completion screen.

Keep this animation fast and premium.

Do not add flashy effects.

The interaction should feel deliberate and satisfying.



6. AI JOURNEY

Use Lovable’s REAL AI infrastructure.

The AI must actually control the decision journey.

The user gives an answer in their own words.

Send the AI:

current journey state

original decision

previous Lock messages

previous user answers

latest user answer

The AI returns strict structured JSON:

{

  "verdict": "lock | unlock | hold | reject",

  "reason": "string",

  "action": "continue | ask_followup | finalize | abort",

  "confidence": 0,

  "next_state": "string | null",

  "followup": "string | null"

}

Validate the response server-side.

Never expose AI credentials to the browser.



7. JOURNEY STATES

Support:

intro

explore

assess_commitment

decision

complete

Typical flow:

Intro

User starts Lock.

Explore

Lock asks the user about the decision.

Assess commitment

The user answers in their own words.

The AI evaluates whether the answer demonstrates commitment or uncertainty.

If uncertain:

action: "ask_followup"

Display the AI’s followup as the next question.

If sufficiently clear:

action: "continue"

Advance the journey.

Decision

When ready, show the final decision and the CORE Slide-to-Confirm interaction.

Complete

After successfully sliding all the way to the end, show the locked result.



8. PROGRESS

Show subtle progress through the journey.

The user should understand that they are moving toward a final commitment.

Do not use a generic SaaS progress bar if it makes the experience feel cheap.

Keep it minimal and consistent with the premium iOS-inspired design.



9. DESIGN DIRECTION

The entire MVP should feel:

premium

minimal

iOS-inspired

dark

calm

focused

tactile

modern

Use generous spacing and strong typography.

Avoid:

generic SaaS dashboards

excessive gradients

excessive glassmorphism

excessive cards

neon colors

unnecessary decorative elements

chatbot-style bubbles everywhere

The interaction should be the visual hero.



10. TECHNICAL REQUIREMENTS

The frontend must communicate with a secure backend.

Create the required backend/API for the AI.

Backend responsibilities:

receive journey state/history/answer

call Lovable’s AI infrastructure

validate structured AI output

return the validated decision

handle AI errors safely

never expose credentials

Add a health/diagnostic endpoint.

Make the architecture clean and easy for another developer/AI agent to migrate later.



11. ERROR HANDLING

If AI generation fails:

preserve the current journey

do not lose the user’s answer

do not expose raw API errors

show a clean retry state

If the AI returns invalid structured data, reject it server-side rather than inventing a response.



12. MVP SCOPE

This is intentionally an MVP.

Build ONLY what is necessary for:

Decision → AI reflection → AI follow-up → commitment → Slide to Lock → locked result

Do not build:

authentication

accounts

payments

subscriptions

analytics

admin

social features

complex database systems

large marketing pages

The MVP should nevertheless feel like a real product, not a prototype made of placeholder buttons.



13. MOST IMPORTANT REQUIREMENT

Before considering the project complete, TEST THE ENTIRE FLOW ON A REAL MOBILE-SIZED SCREEN.

Specifically test the Slide-to-Confirm interaction:

Start dragging.

Stop halfway.

Hold halfway.

Move backward.

Move forward again.

Release before the end.

Verify it resets without confirming.

Drag all the way to the end.

Verify ONLY then does Lock confirm.

Verify the confirmed state and completion screen appear.

The slider must be genuinely controlled by the user’s finger throughout the entire gesture.

Do not replace this behavior with a simple “slide anywhere to confirm” implementation.

The final MVP should make the user think:

“This feels like an iPhone system interaction, but it’s Lock.”

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/77d6ba2c-240e-45d2-a634-ae4e94d80fa0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
