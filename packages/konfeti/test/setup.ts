import "vitest-canvas-mock";

// register every built-in shape, exactly like importing the full `konfeti` entry
import "../src/index";

// keep test output clean; test/utils/Banner.test.ts checks the banner on a fresh module
import { disableBanner } from "../src/index";

disableBanner();
