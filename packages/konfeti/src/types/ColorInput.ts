// all colour-string flavours live together: they are one concept split only for autocomplete.

/**
 * Hex Color String.
 * Supports `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa`.
 */
export type HexColor = `#${string}`;

/**
 * RGB Color String.
 * Comma (`rgb(255, 0, 0)`) and space (`rgb(255 0 0 / 50%)`) syntax are both accepted.
 */
export type RgbColor = `rgb(${string})` | `rgba(${string})`;

/**
 * HSL Color String.
 * Example: `hsl(210 100% 50%)` or `hsla(210, 100%, 50%, 0.8)`.
 */
export type HslColor = `hsl(${string})` | `hsla(${string})`;

/**
 * Modern CSS Color Function String.
 * Parsed by the browser, so support depends on the user's browser.
 */
export type ModernCssColor =
  | `hwb(${string})`
  | `lab(${string})`
  | `lch(${string})`
  | `oklab(${string})`
  | `oklch(${string})`
  | `color(${string})`;

/**
 * CSS Named Color.
 */
export type CssColorName =
  | "transparent"
  | "aliceblue"
  | "antiquewhite"
  | "aqua"
  | "aquamarine"
  | "azure"
  | "beige"
  | "bisque"
  | "black"
  | "blanchedalmond"
  | "blue"
  | "blueviolet"
  | "brown"
  | "burlywood"
  | "cadetblue"
  | "chartreuse"
  | "chocolate"
  | "coral"
  | "cornflowerblue"
  | "cornsilk"
  | "crimson"
  | "cyan"
  | "darkblue"
  | "darkcyan"
  | "darkgoldenrod"
  | "darkgray"
  | "darkgreen"
  | "darkgrey"
  | "darkkhaki"
  | "darkmagenta"
  | "darkolivegreen"
  | "darkorange"
  | "darkorchid"
  | "darkred"
  | "darksalmon"
  | "darkseagreen"
  | "darkslateblue"
  | "darkslategray"
  | "darkslategrey"
  | "darkturquoise"
  | "darkviolet"
  | "deeppink"
  | "deepskyblue"
  | "dimgray"
  | "dimgrey"
  | "dodgerblue"
  | "firebrick"
  | "floralwhite"
  | "forestgreen"
  | "fuchsia"
  | "gainsboro"
  | "ghostwhite"
  | "gold"
  | "goldenrod"
  | "gray"
  | "green"
  | "greenyellow"
  | "grey"
  | "honeydew"
  | "hotpink"
  | "indianred"
  | "indigo"
  | "ivory"
  | "khaki"
  | "lavender"
  | "lavenderblush"
  | "lawngreen"
  | "lemonchiffon"
  | "lightblue"
  | "lightcoral"
  | "lightcyan"
  | "lightgoldenrodyellow"
  | "lightgray"
  | "lightgreen"
  | "lightgrey"
  | "lightpink"
  | "lightsalmon"
  | "lightseagreen"
  | "lightskyblue"
  | "lightslategray"
  | "lightslategrey"
  | "lightsteelblue"
  | "lightyellow"
  | "lime"
  | "limegreen"
  | "linen"
  | "magenta"
  | "maroon"
  | "mediumaquamarine"
  | "mediumblue"
  | "mediumorchid"
  | "mediumpurple"
  | "mediumseagreen"
  | "mediumslateblue"
  | "mediumspringgreen"
  | "mediumturquoise"
  | "mediumvioletred"
  | "midnightblue"
  | "mintcream"
  | "mistyrose"
  | "moccasin"
  | "navajowhite"
  | "navy"
  | "oldlace"
  | "olive"
  | "olivedrab"
  | "orange"
  | "orangered"
  | "orchid"
  | "palegoldenrod"
  | "palegreen"
  | "paleturquoise"
  | "palevioletred"
  | "papayawhip"
  | "peachpuff"
  | "peru"
  | "pink"
  | "plum"
  | "powderblue"
  | "purple"
  | "rebeccapurple"
  | "red"
  | "rosybrown"
  | "royalblue"
  | "saddlebrown"
  | "salmon"
  | "sandybrown"
  | "seagreen"
  | "seashell"
  | "sienna"
  | "silver"
  | "skyblue"
  | "slateblue"
  | "slategray"
  | "slategrey"
  | "snow"
  | "springgreen"
  | "steelblue"
  | "tan"
  | "teal"
  | "thistle"
  | "tomato"
  | "turquoise"
  | "violet"
  | "wheat"
  | "white"
  | "whitesmoke"
  | "yellow"
  | "yellowgreen";

/**
 * Any Supported CSS Color.
 * Invalid colors throw a `TypeError` when `Konfeti.fire()` is called, so typos surface immediately.
 *
 * @example
 * ```ts
 * "#ff0a54" | "rgb(255 208 0)" | "hsl(200 100% 50%)" | "oklch(70% 0.2 30)" | "hotpink"
 * ```
 */
export type ColorInput = HexColor | RgbColor | HslColor | ModernCssColor | CssColorName;
