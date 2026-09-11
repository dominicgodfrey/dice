// Join the team (PLAN.md D22).

import { A, H, P, Page } from "../src/chrome/Page";

export default function Join() {
  return (
    <Page title="Join the team">
      <P>
        Dice is built by students, in the open. If you want to work on something
        people at Brandeis will use every day, there is room.
      </P>
      <H>What there is to do</H>
      <P>
        Design: the tile palette, icons, the look of the expanded views. Data:
        fetchers for dining menus, campus events, and the shuttle feed. Photos:
        the campus map and its checkpoints. Testing on real phones.
      </P>
      <H>How</H>
      <P>
        Clone{" "}
        <A href="https://github.com/dominicgodfrey/dice">
          github.com/dominicgodfrey/dice
        </A>
        , follow the README, and open a pull request or an issue. The README
        gets you from clone to a running web build in about ten minutes.
      </P>
    </Page>
  );
}
