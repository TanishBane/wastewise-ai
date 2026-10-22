# Kitchen planning journal

The user's current brief takes precedence over the previous framed-sheet rules. This pass adds warmth, authored typography, feedback and depth while removing curved panel outlines and decorative effects.

## Foundations

Newsreader is the self-hosted editorial voice for the wordmark and page titles. Source Sans 3 is the self-hosted voice for controls, prose, data and charts. Type uses 12/13/14/16/18/24/32/36px roles, weights 400/500/600/700, and shared heading/body line-height tokens.

The ground is warm mineral #eeeae1, the working surfaces are paper #fffdf7, and the navigation rail is deep forest #19382c. Forest #24533d identifies decisions and the main data series. Amber and clay communicate actual risk. Surface depth uses a small offset soft shadow, never colored underlighting or illuminated borders.

Spacing follows a shared 4px rhythm, with 2px optical details. Surface radii are 0px, field and badge corners are 4px, and genuine circles use 50%. The subsequently corrected liquid metal brief adds a capsule profile for metal actions only. All colors, spacing, radii, weights, type sizes and authored timings reference tokens. Layout-specific sizes have explicit names. Page tools and heading placement stay consistent across routes.

## Liquid metal actions

The user's correction pins the actual [Liquid Metal UI buttons by uixamjad](https://dribbble.com/shots/27185489-Liquid-Metal-UI-buttons) as the button reference. Its public preview was inspected. This supersedes the earlier transparent-button interpretation. The artwork is not bundled with the frontend.

Actions now use a sculpted silver face, a conic chrome rim with bright and dark reflections, inset highlights, and a downward contact shadow. Primary actions have a 3px rim and bold forest lettering; secondary actions use a 2px rim. Rounded action profiles intentionally follow the corrected reference; paper panels stay square and fields retain 4px corners. Selected scenario presets use a forest face with the same chrome rim and retain their pressed semantics. Search and the tour action share the metal treatment. Hover changes the face reflection, while pressing recesses the face and moves the action by 2px. Keyboard focus, reduced motion, actual pending activity, and 44px targets remain functional. Material values are declared in `--metal-*` tokens, with geometry in `--radius-metal` and shadows in `--button-*`. There is no continuous shimmer or colored glow.

## Applied Laws of UX

- [Fitts's Law](https://lawsofux.com/fittss-law/): primary buttons, fields, navigation and review targets have a 44px minimum target, with nearby labels and clear spacing.
- [Hick's Law](https://lawsofux.com/hicks-law/): navigation separates daily planning from learning/maintenance. Scenario presets offer three starting points. Cost adjustments remain behind a named disclosure.
- [Law of Proximity](https://lawsofux.com/law-of-proximity/): control labels, units and explanations remain together. Related values share one surface; section boundaries are square and quiet.
- [Doherty Threshold](https://lawsofux.com/doherty-threshold/): request handlers immediately show a disabled busy button, an activity indicator and structured skeletons. Actual calculation stages advance after the corresponding API response; no artificial waiting or fake percentages are added.
- [Goal-Gradient Effect](https://lawsofux.com/goal-gradient-effect/): menu-review progress comes from checked dishes. “Review next dish” focuses an unfinished item and clears obstructing filters. Completion does not imply a server-side dispatch.
- [Jakob's Law](https://lawsofux.com/jakobs-law/): the wordmark is a normal home link on desktop and mobile. Native form controls and dialogs retain keyboard behavior.

These are design applications, not claims of measured usability gains. They require testing with real canteen operators.

## Motion and feedback

Press feedback uses 120ms; state transitions 160ms; occasional dialogs 200ms; the first overview arrival 240ms with a 40ms stagger. All use shared easing curves. Pointer hover lift is limited to 2px on the primary action. Keyboard command search opens immediately. Charts stay still for reading. Skeletons and button activity communicate an ongoing operation, never an invented completion percentage.

Reduced-motion mode removes movement, stagger and pulsing. Status labels, static loading shapes, focus rings and disabled states remain. Native dialog focus trapping, Escape behavior, and the route-preserving skip link are preserved.

## Evidence and scope

Dataset source labels, uncertainty caveats, stock accounting and simulation limitations are preserved. No fake testimonial, person, sale, live status or saving is introduced. This is an operational app, so its character comes from the kitchen's decisions and preparation rhythm rather than decorative hero imagery.
