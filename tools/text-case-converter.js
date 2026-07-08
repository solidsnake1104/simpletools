document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("tccInput");
  const output = document.getElementById("tccOutput");
  const modeGroup = document.getElementById("tccModeGroup");
  const copyBtn = document.getElementById("tccCopyBtn");
  const clearBtn = document.getElementById("tccClearBtn");

  if (!input || !output || !modeGroup) return;

  let mode = "lower";

  // Breaks any input string (plain text, camelCase, PascalCase, snake_case,
  // or kebab-case) down into an array of lowercase words. Used by the
  // programming-case converters below.
  function toWords(str) {
    return str
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // camelCase / PascalCase boundary
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // e.g. "HTMLParser" -> "HTML Parser"
      .replace(/[_\-]+/g, " ") // snake_case / kebab-case
      .replace(/[^a-zA-Z0-9\s]+/g, " ") // strip remaining punctuation
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.toLowerCase());
  }

  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  const converters = {
    lower: (str) => str.toLowerCase(),

    upper: (str) => str.toUpperCase(),

    title: (str) =>
      str.replace(/\w\S*/g, (word) => capitalize(word.toLowerCase())),

    sentence: (str) => {
      const lower = str.toLowerCase();
      return lower.replace(/(^\s*\w)|([.!?]\s+\w)/g, (match) => match.toUpperCase());
    },

    camel: (str) => {
      const words = toWords(str);
      return words
        .map((w, i) => (i === 0 ? w : capitalize(w)))
        .join("");
    },

    pascal: (str) => toWords(str).map(capitalize).join(""),

    snake: (str) => toWords(str).join("_"),

    kebab: (str) => toWords(str).join("-"),
  };

  function convert() {
    const fn = converters[mode] || converters.lower;
    output.value = input.value ? fn(input.value) : "";
  }

  input.addEventListener("input", convert);

  modeGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".glass-option");
    if (!btn) return;

    mode = btn.dataset.mode;

    [...modeGroup.children].forEach((b) => b.classList.toggle("active", b === btn));

    convert();
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    output.value = "";
    input.focus();
  });

  copyBtn.addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Result"), 1500);
    } catch (err) {
      console.error(err);
      alert("Copy failed. Please copy the text manually.");
    }
  });

  convert();
});