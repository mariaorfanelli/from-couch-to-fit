/**
 * From Couch to Fit — brand palette.
 *
 * Built on warm paper whites and dusty pinks; text never reaches pure black —
 * we use a deep muted plum-charcoal that stays legible without harshness.
 */
const colors = {
  light: {
    // text + surface base
    text: "#322E38",
    tint: "#D98EA0",

    background: "#F7F3F3", // warm canvas
    foreground: "#322E38", // plum charcoal — primary text
    secondaryText: "#6E6873", // supporting body copy
    mutedForeground: "#A39EAA", // labels, hints

    card: "#FFFFFF", // pure white card
    cardAlt: "#FBF9F9", // soft off-white surface
    cardForeground: "#322E38",
    blushTint: "#FCF4F6", // active tab / selected chip background

    // primary pink scale
    primary: "#D98EA0", // primary 400 — main brand
    primaryForeground: "#FFFFFF",
    primaryDeep: "#C16E82", // deep 500 — pressed / accent text
    gradientStart: "#D98EA0",
    gradientEnd: "#B85F74",

    secondary: "#F9E9ED", // blush 100 — soft chip bg
    secondaryForeground: "#C16E82",
    blush200: "#F2D3DB",
    rose300: "#E9AEBB",

    muted: "#FBF9F9",
    accent: "#C16E82",
    accentForeground: "#FFFFFF",

    // semantic
    success: "#A9B7A4", // calm sage
    successForeground: "#FFFFFF",
    destructive: "#C16E82",
    destructiveForeground: "#FFFFFF",
    plum: "#9B8AA6", // soft plum — secondary accent

    // borders + inputs
    border: "#EDE8EA", // hairline divider
    input: "#FBF9F9",
    inputFocus: "#E0A0B0", // pink focus ring border
  },

  radius: 16,
};

export default colors;
