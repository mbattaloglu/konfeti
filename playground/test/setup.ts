import "vitest-canvas-mock";

import { disableBanner } from "konfeti";

import { RecordingPath2D } from "./helpers/RecordingPath2D";

// after the canvas mock, which only installs Path2D when none exists
globalThis.Path2D = RecordingPath2D;
disableBanner();
