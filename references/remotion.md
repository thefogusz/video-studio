# Remotion (React → video)

Use when the user lives in React, wants a parametric template (props → many
videos), or wants a live preview studio.

**Licence:** Remotion is free for individuals and companies of ≤3 people;
larger companies need a paid company licence. Mention this before building
anything commercial for an organisation.

## Setup and render

```bash
npx create-video@latest my-video          # choose a template (blank / hello-world)
cd my-video && npm i
npx remotion studio                       # live preview in the browser
npx remotion render src/index.ts MyComp out/my_v001.mp4
npx remotion render src/index.ts MyComp out/my_v001.mp4 --props='{"title":"สวัสดี"}'
npx remotion still src/index.ts MyComp work/frame45.png --frame=45   # evidence frame
```

## Core model

```tsx
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Easing} from "remotion";

export const Title: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200}});              // 0 → 1
  const exitOpacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic)});
  return (
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center", background: "#0d0d12"}}>
      <h1 style={{fontFamily: "Prompt", fontSize: 120, color: "white", opacity: exitOpacity,
                  transform: `translateY(${(1 - enter) * 120}px)`}}>{text}</h1>
    </AbsoluteFill>
  );
};

// Root: <Composition id="MyComp" component={Main} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{title: "..."}} />
// Main:  <Sequence from={0} durationInFrames={90}><Title text={props.title}/></Sequence>
```

Rules:
- Every visual value is a function of `useCurrentFrame()`. No CSS
  transitions/animations, no `setTimeout`, no `Math.random()` (use
  `random("seed")` from remotion).
- Always `clamp` in `interpolate`, otherwise values overshoot past the range.
- Use `<Sequence>` to place scenes in time; inside a Sequence the frame
  restarts at 0, so components are reusable.
- Media: `<OffthreadVideo src={staticFile("clip.mp4")}/>`, `<Audio>`,
  `<Img>` — these wait for loading; plain `<img>`/`<video>` can render blank.
- Fonts: load with `@remotion/google-fonts/Prompt` (or `staticFile` +
  `FontFace`) and wait for them; Thai needs a Thai-capable family.
- Captions: `@remotion/captions` turns Whisper-style word timestamps into
  pages/tokens for TikTok-style captions.
- Data-driven batches: compute props per item and loop `npx remotion render`
  (or use `@remotion/renderer` `renderMedia()` from a Node script).

## Verify

`npx remotion still` at key frames, then ffprobe + contact sheet of the MP4.
