# Align Studio

I wrote the initial framework for Align Studio myself, then used AI assistance to refine parts of the project structure and improve the accuracy of the movement references and pose comparisons.

A browser-only prototype using Three.js 0.180.0 and MediaPipe Tasks Vision 0.10.21.

Edit the application in `src/`. Run `npm run dev` to serve it at `http://localhost:5173`, or serve `src/` using any static HTTP server. Run `npm test` for the pose checks. `npm run build` copies public application files into the ignored `build/` folder used for hosting; no dependencies need to be installed. Camera access is opt-in; frames are processed locally and never uploaded. Libraries, fonts and the pose model load from third-party CDNs, so the first visit requires network access.

The studio opens with a single movement guide. **Change pose** opens a searchable modal with All, Stretches, and Yoga filters and illustrated previews of all 32 movements. Selecting a movement closes the modal; Escape and the close button also dismiss it and return focus to the launcher. **Pose details** reveals the instructions and manual hold timer. Live comparison metrics are available in a collapsed section while the camera is active.

Includes overhead reach, standing side bend, Mountain pose and Warrior II, a rotatable 3D reference, mirrored camera landmarks, visibility-gated alignment feedback, and an independent manual hold timer. The movement definitions and pure pose checks are separated to support future exercises.

## Limitations

This is not clinically validated. Rules check a few 2D landmark relationships, not pain, joint loading, balance, depth, or injury risk. Thresholds are illustrative product heuristics and must be reviewed by qualified movement professionals before safety-related use. Poor framing, camera angle, occlusion and clothing can produce inaccurate feedback. Never interpret a matching reference as a guarantee of safe form. Lifting and additional exercises are not yet included.

## Verification

JavaScript syntax and pure-rule checks passed for joint angles, reference alignment, misalignment, missing landmarks, and low-confidence landmarks. Local HTTP preview responds successfully. Native browser automation was unavailable in the execution environment, so live webcam/model inference, visual rendering and experimental WebMCP integration require an in-browser acceptance check.

## Live reference comparison

The 3D guide stays visible during tracking. Live pose lines are normalized to the reference hip origin and torso length, with differing joints highlighted and approximate joint-angle comparisons below. The same reference geometry drives the 3D model, camera ghost, and comparison calculations. Side bend and Warrior II support reversing the reference side. Camera imagery is hidden by default and only appears in the Show camera dialog; closing the dialog keeps tracking active.

Comparison checks cover all four references in both directions, normalization, and a displaced wrist producing correction feedback. Camera and browser visual acceptance checks remain unavailable in this environment. The line overlay represents a front-view 2D estimate; rotating the guide does not recover the user's actual depth.

## Expanded practice library and matching colors

The library now contains 24 movements (20 added) with pose-specific geometry and setup cues. Live backgrounds transition red/orange/green using mean and worst joint-angle differences; green requires every measured angle to fall within its heuristic tolerance. Missing or invalid tracking resets to a neutral background. These colors measure reference similarity, not injury risk or clinical correctness. Seated and overlapping-limb positions are particularly limited by a single front-view camera.

Automatic browser-filling animation enters after 600 ms of stable tracking and stays open through tracking loss. Escape dismisses it until a new loss/reacquisition cycle. Reduced-motion preferences disable the animation. Camera imagery remains opt-in.

Run `node tests/pose-comparison.mjs` for all 24 references in both directions, altered-limb corrections, visibility checks, color boundaries, and focus-view timing. Live webcam and visual animation testing still require browser acceptance testing.

## Side-view yoga and model visibility

The library contains 32 movements, adding Downward-facing Dog, High Plank, Forearm Plank, Low Cobra, Sphinx, Extended Child's Pose, Tabletop, and Chair. These default to side-view references and use the clearly visible body side for comparison. Hidden-side joints are not displayed as tracked points. Front/Side buttons rotate each model for inspection and remember that pose's chosen view during the session; they do not change the camera setup required for tracking.

The camera framing fits each pose's height and width and expands its screen coverage in browser-filling mode. Head and torso orientation now follow the body axis for floor poses. A detected comparable pose lightens the reference material, darkens the tracking overlay, and uses subtle red/orange/green similarity backgrounds. This remains a 2D angle prototype, not a load, spine-curve, pain or safety assessment. Live camera/browser visual acceptance testing remains unverified.


## Camera acquisition guidance

Camera startup now displays a large body-framing illustration and explicit permission, model-loading, and slow-download states. Live guidance distinguishes no detection, clipped limbs, a body too small in frame, low-confidence joints, overlapping joints, and stable tracking. Front/side setup follows the selected movement. The initial 2–3 m suggestion is only a starting point; framing cues use normalized image coordinates, not measured physical distance or verified body orientation. The ready badge means tracking is available, not that form matches the reference; the manual hold timer remains independent.

Guidance settles for 600 ms before showing ready and tolerates 1500 ms of tracking loss. The optional Voice toggle uses browser speech synthesis, starts off, avoids repeated announcements, and cancels speech when stopped or muted. Unsupported browsers retain visual guidance. A stalled camera frame stream gets its own restart cue.

Validated with the existing 32-movement tests, additional framing/acquisition/loss tests, a successful build, and browser checks of simulated front/side acquisition and compact ready layouts including a narrow viewport. Live webcam inference and audible speech still require device testing.


## Confirmed holds

Being in view is now labelled “Tracking · adjust your pose” without a success checkmark. A hold qualifies only when all reference metrics match and the movement-specific assessment is good or ready. A continuous three-second hold shows a countdown, followed by two seconds of confirmation and a persistent completion badge. Deviations or missing frames reset an unfinished hold; frame gaps over 500 ms do not count. Completed holds do not close focus mode. Losing tracking for four seconds, switching movements/sides, or restarting the camera resets the cycle. Focus mode stays open through tracking loss and exits only through explicit navigation, stopping the camera, or a camera failure. The background turns green only after hold confirmation. These thresholds remain prototype heuristics; physical webcam acceptance is still needed.


Body guidance now uses confirmed hold progress rather than body detection to decide when to compact. Detecting a comparable body keeps the illustrated adjustment cue visible, including the movement correction. It stays visible during the three-second hold and two-second confirmation, then becomes a completion badge. The model has a separate viewing area while the cue is docked. Regression checks include ten seconds of incorrect-but-detected posture without compacting, plus hold and confirmation phases; browser verification uses simulated input without accessing the webcam.


Current interaction: body guidance stays visible in a fixed layout through detection, adjustment and completion. Only the explicit Hide cues control hides it; Show cues restores it. Tracking no longer automatically enlarges the stage; Expand practice is a manual control. Recognition does not dismiss or move the panel. Earlier descriptions of automatic focus entry or completion compaction above are superseded. Regression checks also reject arms-down standing as a qualified overhead reach.


## Languages

The top-right language control shows English first, followed by 中文. First-time visits default to English regardless of browser language. Explicit language choices are saved locally when storage is available. Switching languages preserves the current pose and practice state. All 32 movements support English and Chinese search, descriptions and cues; camera guidance and speech use the selected language. The translation catalog is in `src/translations-zh.mjs` and pose text in `src/poses-zh.mjs`. `npm test` includes translation coverage and dynamic feedback checks.
