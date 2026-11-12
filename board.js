// The board shares the existing step state; every visible tile is earned by a step.
const ROUND_COLOURS = ['var(--round-0)', 'var(--round-1)', 'var(--round-2)', 'var(--round-3)', 'var(--round-4)'];
let boardEntryPreferred = false;

function roundColour(round) {
  return ROUND_COLOURS[round % ROUND_COLOURS.length];
}

function tile(value, colour, extra = '', attributes = '') {
  return `<span class="tile ${extra}" style="--tile-color:${colour}" ${attributes}>${value}</span>`;
}

function columnRound(column) {
  return longProblem.steps.findIndex(step => column <= step.endIndex);
}

function boardEntry(label, digitIndex, colour, attributes = '') {
  return `<span class="tile board-entry" style="--tile-color:${colour}" ${attributes}><input id="${digitIndex === 0 ? 'boardAnswer' : `boardAnswer${digitIndex}`}" class="board-answer" data-board-digit="${digitIndex}" aria-label="${label}, digit ${digitIndex + 1} on the board" inputmode="numeric" autocomplete="off" maxlength="1" placeholder=" " onfocus="boardEntryPreferred = true" oninput="syncLongAnswer(this)" onkeydown="handleLongAnswerKey(event)"><span class="board-placeholder" aria-hidden="true">?</span></span>`;
}

function numberRow(value, endColumn, colour, extra = '', attributes = '', editable = false) {
  const digits = String(value);
  const start = endColumn - digits.length + 1;
  return `<div class="work-number-row ${extra}" style="--minus-column:${start}" ${attributes}>${
    Array.from(String(longProblem.dividend), (_, column) => column >= start && column <= endColumn
      ? (editable ? boardEntry('Product', column - start, colour) : tile(digits[column - start], colour))
      : tile('', colour, 'blank', 'aria-hidden="true"')).join('')
  }</div>`;
}

function formalRows() {
  const rows = [];
  longProblem.steps.forEach((step, round) => {
    const pending = part => round === longStepIndex && !longReadyForNext && currentLongPart() === part;
    if (isLongPartVisible(round, 'multiply') || pending('multiply')) {
      rows.push(numberRow(step.product, step.endIndex, roundColour(round), 'has-minus', `data-product-round="${round}"`, pending('multiply')));
      const start = step.endIndex - Math.max(String(step.partial).length, String(step.product).length) + 1;
      rows.push(`<div class="work-number-row rule-row"><span class="work-rule" style="--rule-start:${start + 1};--rule-end:${step.endIndex + 2}"></span></div>`);
    }
    if (isLongPartVisible(round, 'subtract') || pending('subtract')) {
      const cells = Array(String(longProblem.dividend).length).fill('');
      const remainder = String(step.remainder);
      const start = step.endIndex - remainder.length + 1;
      for (let i = 0; i < remainder.length; i++) cells[start + i] = pending('subtract')
        ? boardEntry('Remainder', i, roundColour(round)) : tile(remainder[i], roundColour(round));
      if ((isLongPartVisible(round, 'bring') || pending('bring')) && step.bringDown !== '') {
        const column = step.endIndex + 1;
        cells[column] = pending('bring')
          ? boardEntry('Bring down', 0, roundColour(columnRound(column)), `data-bring-column="${column}"`)
          : tile(step.bringDown, roundColour(columnRound(column)), 'brought-down', `data-bring-column="${column}"`);
      }
      rows.push(`<div class="work-number-row" data-remainder-round="${round}">${cells.map(cell => cell || tile('', 'transparent', 'blank', 'aria-hidden="true"')).join('')}</div>`);
    }
  });
  return rows.join('');
}

function drawBringDownArrows() {
  const board = document.querySelector('.division-board');
  if (!board) return;
  const svg = board.querySelector('.arrow-layer');
  const bounds = board.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  svg.innerHTML = [...board.querySelectorAll('[data-bring-column]')].map(target => {
    const column = Number(target.dataset.bringColumn);
    const source = board.querySelector(`[data-dividend-column="${column}"]`);
    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const x = from.left + from.width / 2 - bounds.left;
    const y1 = from.bottom - bounds.top + 5;
    const y2 = to.top - bounds.top - 6;
    const colour = roundColour(columnRound(column));
    return `<path data-arrow-column="${column}" d="M ${x} ${y1} V ${y2 - 10}" stroke="${colour}" stroke-width="5" fill="none"/><path d="M ${x - 8} ${y2 - 13} L ${x} ${y2} L ${x + 8} ${y2 - 13} Z" fill="${colour}"/>`;
  }).join('');
}

function renderLongDivision() {
  if (!longProblem) return;
  updatePracticeControls();
  const board = document.getElementById('longBoard');
  const stepArea = document.getElementById('longStepArea');
  const keepKeyboardFocus = document.activeElement.matches('.board-answer, #longAnswer, #longMainButton');
  const digits = String(longProblem.dividend).split('');
  const active = longProblem.steps[longStepIndex];
  const part = active ? currentLongPart() : null;
  const finalRemainder = longProblem.dividend % longProblem.divisor;
  const showRemainder = !active && finalRemainder !== 0;
  const quotient = Array(digits.length).fill(null);
  longProblem.steps.forEach((step, round) => {
    if (isLongPartVisible(round, 'divide')) quotient[step.endIndex] = { value: step.qDigit, round };
  });
  const summary = !active
    ? `Answer: ${Math.floor(longProblem.dividend / longProblem.divisor)}${finalRemainder ? ` remainder ${finalRemainder}` : ''}.`
    : `${longPartDetails(active, part).prompt}`;
  board.setAttribute('aria-label', `${longProblem.dividend} divided by ${longProblem.divisor}. ${summary} Coloured working follows below.`);
  board.innerHTML = `
    <div class="division-board ${showRemainder ? 'with-remainder' : ''}" style="--digit-count:${digits.length}">
      ${tile(longProblem.divisor, 'var(--coral)', 'divisor-tile', 'aria-label="Divisor"')}
      <div class="house">
        <div class="quotient-line" aria-label="Quotient">
          ${quotient.map((entry, column) => {
            if (entry) return tile(entry.value, roundColour(entry.round), '', `data-quotient-column="${column}"`);
            if (active && part === 'divide' && !longReadyForNext && column === active.endIndex) {
              return boardEntry('Quotient', 0, roundColour(longStepIndex));
            }
            return tile('', 'transparent', column < longProblem.steps[0].endIndex ? 'blank' : 'empty', `aria-label="${column < longProblem.steps[0].endIndex ? 'No quotient digit' : 'Quotient digit not yet entered'}"`);
          }).join('')}
          ${showRemainder ? `<span class="quotient-remainder">R ${tile(finalRemainder, 'var(--remainder)')}</span>` : ''}
        </div>
        <div class="dividend-line" aria-label="Dividend">
          ${digits.map((digit, column) => tile(digit, roundColour(columnRound(column)), active && column >= active.startIndex && column <= active.endIndex ? 'active-tile' : '', `data-dividend-column="${column}" title="${placeLabel(column, digits.length)}"`)).join('')}
        </div>
        <div class="formal-work">${formalRows()}</div>
      </div>
      <svg class="arrow-layer" aria-hidden="true"></svg>
    </div>`;

  if (!active) {
    const q = Math.floor(longProblem.dividend / longProblem.divisor);
    stepArea.innerHTML = `<h3 class="step-title">Division complete!</h3><p class="completion">${longProblem.dividend} ÷ ${longProblem.divisor} = <strong>${q}${finalRemainder ? ` rem. ${finalRemainder}` : ''}</strong></p><p class="step-prompt">Check: ${longProblem.divisor} × ${q}${finalRemainder ? ` + ${finalRemainder}` : ''} = ${longProblem.dividend}</p>${renderWorkingLines()}`;
  } else {
    const detail = longPartDetails(active, part);
    stepArea.innerHTML = `
      <ol class="step-rail" aria-label="Long division steps">
        ${[['divide', 'Divide'], ['multiply', 'Multiply'], ['subtract', 'Subtract'], ['bring', 'Bring down']].map(([key, label]) => `<li ${key === part ? 'class="current" aria-current="step"' : ''}>${label}</li>`).join('')}
      </ol>
      <h3 class="step-title">${detail.prompt}</h3>
      <p class="step-prompt">Answer on the board or here.</p>
      <div class="field"><label for="longAnswer">${detail.label}</label><input id="longAnswer" inputmode="numeric" autocomplete="off" value="${longReadyForNext ? detail.answer : ''}" onfocus="boardEntryPreferred = false" oninput="syncLongAnswer(this)" onkeydown="handleLongAnswerKey(event)" ${longReadyForNext ? 'disabled' : ''}></div>
      <div class="step-actions"><button class="primary" id="longMainButton" type="button" onclick="handleLongMainAction()">${longReadyForNext ? 'Next' : 'Check'}</button></div>
      ${renderWorkingLines()}`;
    // Avoid a touch keyboard opening itself on iPad; retain focus after keyboard answers.
    if (longReadyForNext) document.getElementById('longMainButton').focus({ preventScroll: true });
    else if (keepKeyboardFocus) document.getElementById(boardEntryPreferred || document.getElementById('longPanel').classList.contains('help-collapsed') ? 'boardAnswer' : 'longAnswer').focus({ preventScroll: true });
  }
  requestAnimationFrame(drawBringDownArrows);
}
