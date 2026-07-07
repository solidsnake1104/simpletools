document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("wcTextarea");
  const clearBtn = document.getElementById("wcClearBtn");
  const copyBtn = document.getElementById("wcCopyBtn");
  const limitInput = document.getElementById("wcLimitInput");

  const wordsEl = document.getElementById("wcWords");
  const charsEl = document.getElementById("wcChars");
  const charsNoSpaceEl = document.getElementById("wcCharsNoSpace");
  const sentencesEl = document.getElementById("wcSentences");
  const paragraphsEl = document.getElementById("wcParagraphs");
  const readingTimeEl = document.getElementById("wcReadingTime");

  if (!textarea) return;

  function countWords(text) {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  function countSentences(text) {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    const matches = trimmed.match(/[^.!?]+[.!?]+|\S+$/g);
    return matches ? matches.filter((s) => s.trim().length > 0).length : 0;
  }

  function countParagraphs(text) {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  }

  function formatReadingTime(words) {
    if (words === 0) return "0 min";
    const minutes = words / 200;
    if (minutes < 1) return "< 1 min";
    return Math.round(minutes) + " min";
  }

  function update() {
    const text = textarea.value;

    const words = countWords(text);
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const sentences = countSentences(text);
    const paragraphs = countParagraphs(text);

    wordsEl.textContent = words.toLocaleString();
    charsEl.textContent = chars.toLocaleString();
    charsNoSpaceEl.textContent = charsNoSpace.toLocaleString();
    sentencesEl.textContent = sentences.toLocaleString();
    paragraphsEl.textContent = paragraphs.toLocaleString();
    readingTimeEl.textContent = formatReadingTime(words);

    const limit = parseInt(limitInput.value, 10);
    if (limit > 0) {
      charsEl.classList.toggle("is-over-limit", chars > limit);
    } else {
      charsEl.classList.remove("is-over-limit");
    }
  }

  textarea.addEventListener("input", update);
  limitInput.addEventListener("input", update);

  clearBtn.addEventListener("click", () => {
    textarea.value = "";
    textarea.focus();
    update();
  });

  copyBtn.addEventListener("click", async () => {
    if (!textarea.value) return;
    try {
      await navigator.clipboard.writeText(textarea.value);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Text"), 1500);
    } catch (err) {
      console.error(err);
      alert("Copy failed. Please copy the text manually.");
    }
  });

  update();
});