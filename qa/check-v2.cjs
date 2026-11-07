// Uses the workstation's shared Playwright installation. No project install needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const runtime = process.env.PLAYWRIGHT_RUNTIME || path.join(process.env.USERPROFILE || process.env.HOME, '.codex/tools/visual-check-runtime/node_modules/playwright');
const { chromium } = require(runtime);
const root = path.resolve(__dirname, '..');
const checks = [];
const errors = [];
const external = [];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html');
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(data);
  });
});
let browser;
async function check(name, action) { await action(); checks.push(name); console.log('PASS ' + name); }
async function partial(page) {
  await page.evaluate(() => { setLongSample('7372 ÷ 3'); for (let i = 0; i < 8; i++) { revealLongStep(); handleLongMainAction(); } });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function geometry(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  await page.evaluate(() => {
    const assert = (ok, message) => { if (!ok) throw Error(message); };
    assert(document.documentElement.scrollWidth <= innerWidth + 1, 'page must not overflow horizontally');
    const board = document.querySelector('.division-board');
    const columns = [...board.querySelectorAll('[data-dividend-column]')].map(el => el.getBoundingClientRect());
    for (const row of board.querySelectorAll('.quotient-line, .work-number-row')) {
      if (row.classList.contains('rule-row')) continue;
      [...row.children].filter(el => el.classList.contains('tile')).forEach((el, i) => {
        assert(Math.abs(el.getBoundingClientRect().left - columns[i].left) < 1, 'digit column alignment');
      });
    }
    for (const target of board.querySelectorAll('[data-bring-column]')) {
      const column = Number(target.dataset.bringColumn);
      const rect = target.getBoundingClientRect();
      assert(Math.abs(rect.left - columns[column].left) < 1, 'bring-down alignment');
      const arrow = board.querySelector(`[data-arrow-column="${column}"]`);
      assert(!!arrow, 'bring-down arrow exists');
      const start = arrow.getPointAtLength(0);
      const end = arrow.getPointAtLength(arrow.getTotalLength());
      const bounds = board.getBoundingClientRect();
      assert(Math.abs(bounds.left + start.x - rect.left - rect.width / 2) < 1, 'arrow horizontal position');
      assert(Math.abs(bounds.top + start.y - columns[column].bottom - 5) < 1, 'arrow source');
      assert(Math.abs(bounds.top + end.y - rect.top + 16) < 1, 'arrow target');
    }
  });
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1448, height: 1086 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', req => { if (/^https?:/.test(req.url()) && !req.url().startsWith(base)) external.push(req.url()); });
  await page.goto(base + '/index.html');
  await page.waitForFunction(() => typeof longProblem !== 'undefined' && longProblem !== null);
  await check('default screen and visible mode controls', async () => {
    assert.equal(await page.locator('#longProblemHeading').textContent(), '48 ÷ 2');
    assert(await page.locator('#shortTab').isVisible());
    assert.equal(await page.locator('#longAnswer').inputValue(), '');
    await page.screenshot({ path: path.join(root, 'screenshots/v2-start.png'), fullPage: true });
  });
  await check('five practice levels advance only after completion and begin with two-digit exact division', async () => {
    await page.locator('#practiceLevel').selectOption('0');
    const levels = await page.evaluate(() => practiceLevels);
    assert.deepEqual(levels[0].problems, ['48 ÷ 2', '84 ÷ 4', '96 ÷ 3']);
    await page.evaluate(() => {
      for (const equation of practiceLevels[0].problems) {
        const { dividend, divisor } = parseEquation(equation);
        if (dividend < 10 || dividend > 99 || dividend % divisor) throw Error('beginner scope');
        if (buildLongSteps(dividend, divisor).some(step => step.remainder !== 0)) throw Error('beginner carrying');
      }
    });
    for (let level = 0; level < levels.length; level++) {
      for (let problem = 0; problem < levels[level].problems.length; problem++) {
        assert.equal(await page.locator('#longProblemHeading').textContent(), levels[level].problems[problem]);
        assert.equal(await page.locator('#practiceLevel').inputValue(), String(level));
        assert(await page.locator('#nextPractice').isDisabled());
        await page.evaluate(() => nextPracticeProblem());
        assert.equal(await page.locator('#longProblemHeading').textContent(), levels[level].problems[problem]);
        await page.evaluate(() => { while (longProblem.steps[longStepIndex]) { revealLongStep(); handleLongMainAction(); } });
        assert(await page.locator('#nextPractice').isEnabled());
        if (problem === levels[level].problems.length - 1 && level < levels.length - 1) {
          assert.equal(await page.locator('#nextPractice').textContent(), 'Next level');
        }
        await page.locator('#nextPractice').click();
      }
    }
    assert.equal(await page.locator('#longProblemHeading').textContent(), levels[4].problems[0]);
    await page.evaluate(() => setLongSample('7372 ÷ 3'));
    assert.equal(await page.locator('#practiceLevel').inputValue(), 'custom');
    await page.locator('#practiceLevel').selectOption('0');
    assert.equal(await page.locator('#longProblemHeading').textContent(), '48 ÷ 2');
  });
  await check('120,012 division calculations including zero quotient digits', async () => {
    await page.evaluate(() => {
      for (let n = 0; n <= 10000; n++) for (let d = 1; d <= 12; d++) {
        const steps = buildLongSteps(n, d);
        const quotient = Number(steps.map(s => s.qDigit).join(''));
        const remainder = steps[steps.length - 1].remainder;
        if (quotient !== Math.floor(n / d) || remainder !== n % d || quotient * d + remainder !== n) throw Error(`${n} ÷ ${d}`);
      }
    });
  });
  await check('all long samples and boundary problems complete correctly', async () => {
    await page.evaluate(() => {
      const samples = [...document.querySelectorAll('[onclick^="setLongSample"]')].map(b => b.textContent);
      samples.push('7372 ÷ 3', '1005 ÷ 5', '1000 ÷ 10', '1001 ÷ 2', '0 ÷ 3', '2 ÷ 9', '12 ÷ 12', '1200 ÷ 12', '99999 ÷ 7');
      for (const sample of samples) {
        setLongSample(sample);
        const n = longProblem.dividend, d = longProblem.divisor;
        for (let count = 0; longProblem.steps[longStepIndex]; count++) {
          if (count > 100) throw Error('step loop');
          const detail = longPartDetails(longProblem.steps[longStepIndex], currentLongPart());
          document.getElementById('longAnswer').value = detail.answer;
          checkLongStep(); if (!longReadyForNext) throw Error('correct answer rejected');
          handleLongMainAction();
        }
        const q = [...document.querySelectorAll('[data-quotient-column]')].map(el => el.textContent).join('');
        if (Number(q) !== Math.floor(n / d)) throw Error('display quotient ' + sample);
        const rem = document.querySelector('.quotient-remainder .tile');
        if (Number(rem?.textContent || 0) !== n % d) throw Error('display remainder ' + sample);
        revealLongStep(); handleLongMainAction(); // completion controls are safe
      }
    });
  });
  await check('wrong answers do not advance; keyboard Check and Next work', async () => {
    await page.evaluate(() => setLongSample('84 ÷ 4'));
    await page.locator('#longAnswer').fill('99'); await page.locator('#longAnswer').press('Enter');
    assert.equal(await page.evaluate(() => longStepIndex + ':' + longPartIndex), '0:0');
    assert(await page.locator('#longFeedback').evaluate(el => el.classList.contains('bad')));
    await page.locator('#longAnswer').fill('2'); await page.locator('#longAnswer').press('Enter');
    assert.equal(await page.locator('#longMainButton').textContent(), 'Next');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => currentLongPart()), 'multiply');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'longAnswer');
  });
  await check('both division signs accepted; invalid input clears stale state', async () => {
    await page.evaluate(() => {
      for (const value of ['84 / 4', '84 ÷ 4']) if (parseEquation(value).dividend !== 84) throw Error(value);
      for (const value of ['', '84 ÷', '÷ 4', '-84 ÷ 4', '4.2 ÷ 2', '84 ÷ 0', '84 ÷ 13', '1e3 ÷ 2', '<img> ÷ 2']) {
        if (!parseEquation(value).error) throw Error('accepted ' + value);
        setLongSample(value); if (longProblem !== null) throw Error('stale long problem');
        revealLongStep(); resetLongWork();
      }
    });
  });
  await check('board and side answers sync, validate and clear at the next round', async () => {
    await page.evaluate(() => setLongSample('7372 ÷ 3'));
    assert.equal(await page.locator('.quotient-line input').count(), 1);
    await page.locator('#boardAnswer').fill('9');
    assert.equal(await page.locator('#longAnswer').inputValue(), '9');
    await page.locator('#boardAnswer').press('Enter');
    assert.equal(await page.evaluate(() => longReadyForNext), false);
    assert.equal(await page.locator('#boardAnswer').inputValue(), '9');
    await page.locator('#longAnswer').fill('2');
    assert.equal(await page.locator('#boardAnswer').inputValue(), '2');
    await page.locator('#boardAnswer').press('Enter');
    assert.equal(await page.locator('#boardAnswer').count(), 0);
    assert.equal(await page.locator('[data-quotient-column="0"]').textContent(), '2');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => currentLongPart()), 'multiply');
    assert.equal(await page.locator('.formal-work #boardAnswer').count(), 1);
    await partial(page);
    assert.equal(await page.locator('#boardAnswer').inputValue(), '');
    await page.locator('#boardAnswer').fill('5');
    await page.locator('#longMainButton').click();
    assert.equal(await page.locator('[data-quotient-column="2"]').textContent(), '5');
    await page.evaluate(() => resetLongWork());
    assert.equal(await page.locator('#boardAnswer').inputValue(), '');
    assert.equal(await page.locator('#longAnswer').inputValue(), '');
    await page.evaluate(() => setLongSample('0 ÷ 3'));
    await page.locator('#boardAnswer').fill('0'); await page.locator('#boardAnswer').press('Enter');
    assert.equal(await page.locator('[data-quotient-column="0"]').textContent(), '0');
  });
  await check('whole sums can be completed on the board, including multi-digit answers', async () => {
    for (const problem of ['7372 ÷ 3', '1005 ÷ 5', '119 ÷ 12']) {
      await page.evaluate(problem => setLongSample(problem), problem);
      let count = 0;
      while (await page.evaluate(() => !!longProblem.steps[longStepIndex])) {
        assert(++count < 60);
        const state = await page.evaluate(() => ({
          part: currentLongPart(), answer: longPartDetails(longProblem.steps[longStepIndex], currentLongPart()).answer
        }));
        const fields = page.locator('[data-board-digit]');
        assert.equal(await fields.count(), state.answer.length);
        await fields.first().fill(state.answer === '9' ? '8' : '9');
        await fields.first().press('Enter');
        assert.equal(await page.evaluate(() => longReadyForNext), false);
        await page.locator('#longAnswer').fill(state.answer);
        assert.deepEqual(await fields.evaluateAll(els => els.map(el => el.value)), state.answer.split(''));
        await page.locator('#longAnswer').fill('');
        for (let i = 0; i < state.answer.length; i++) await fields.nth(i).fill(state.answer[i]);
        assert.equal(await page.locator('#longAnswer').inputValue(), state.answer);
        await fields.last().press('Enter');
        assert.equal(await page.locator('[data-board-digit]').count(), 0);
        await page.keyboard.press('Enter');
        if (await page.evaluate(() => !!longProblem.steps[longStepIndex])) {
          assert.equal(await page.evaluate(() => document.activeElement.id), 'boardAnswer');
          await geometry(page);
        }
      }
      assert(await page.locator('.step-title').textContent().then(text => text.includes('complete')));
    }
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.evaluate(() => { setLongSample('7372 ÷ 3'); for (let i = 0; i < 2; i++) { revealLongStep(); handleLongMainAction(); } });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    await page.screenshot({ path: path.join(root, 'screenshots/v2-board-subtract.png'), fullPage: true });
  });
  await check('short division samples and leading quotient spaces', async () => {
    await page.getByRole('button', { name: 'Short Division', exact: true }).click();
    await page.evaluate(() => {
      const samples = [...document.querySelectorAll('[onclick^="setShortSample"]')].map(b => b.textContent);
      for (const sample of [...samples, '12 ÷ 12', '0 ÷ 3', '1005 ÷ 5']) {
        setShortSample(sample); revealShortDivision(); checkShortDivision();
        if (document.getElementById('shortFeedback').textContent !== 'Correct.') throw Error(sample);
      }
      setShortSample('84 ÷ 0'); revealShortDivision(); if (shortProblem !== null) throw Error('stale short problem');
      setShortSample('852 ÷ 8');
    });
    await page.screenshot({ path: path.join(root, 'screenshots/v2-short.png'), fullPage: true });
    await page.getByRole('button', { name: 'Long Division', exact: true }).click();
  });
  await check('teacher settings and all sample buttons remain available', async () => {
    await page.locator('#teacherToggle').click();
    assert.equal(await page.locator('#teacherToggle').getAttribute('aria-expanded'), 'true');
    await page.getByRole('button', { name: '48 ÷ 2', exact: true }).click();
    assert.equal(await page.locator('#longProblemHeading').textContent(), '48 ÷ 2');
    await page.locator('#teacherToggle').click();
  });
  await partial(page);
  await check('approved partial state colours and no future answers', async () => {
    assert.equal(await page.locator('.step-title').textContent(), 'How many 3s fit into 17?');
    assert.equal(await page.locator('[data-quotient-column]').allTextContents().then(v => v.join('')), '24');
    assert.equal(await page.locator('.brought-down').allTextContents().then(v => v.join('')), '37');
    assert.equal(await page.locator('[data-product-round="1"] .tile:not(.blank)').evaluateAll(els => new Set(els.map(el => getComputedStyle(el).backgroundColor)).size), 1);
    assert.equal(await page.locator('.quotient-remainder').count(), 0);
  });
  for (const [name, width, height] of [['desktop', 1448, 1086], ['ipad-landscape', 1024, 768], ['ipad-portrait', 768, 1024], ['mobile', 390, 844]]) {
    await check(name + ' layout, digit alignment and arrow geometry', async () => {
      await page.setViewportSize({ width, height }); await partial(page); await geometry(page);
      await page.locator('#longAnswer').blur();
      await page.screenshot({ path: path.join(root, `screenshots/v2-${name}.png`), fullPage: true });
      if (name === 'ipad-landscape') {
        assert(await page.locator('.lesson-tools').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), 'iPad landscape partial-state tools fit the viewport');
      }
    });
  }
  await check('completed remainder layout and reset', async () => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.evaluate(() => { setLongSample('7372 ÷ 3'); while (longProblem.steps[longStepIndex]) { revealLongStep(); handleLongMainAction(); } });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    await geometry(page);
    await page.screenshot({ path: path.join(root, 'screenshots/v2-complete.png'), fullPage: true });
    await page.getByRole('button', { name: 'Reset', exact: true }).last().click();
    assert.equal(await page.locator('[data-quotient-column]').count(), 0);
    assert.equal(await page.locator('.brought-down').count(), 0);
    assert.equal(await page.locator('#longFeedback').textContent(), '');
  });
  await check('scratchpad drawing, undo, redo and clear', async () => {
    await page.getByRole('button', { name: 'Scratchpad', exact: true }).first().click();
    const canvas = page.locator('#scratchCanvas'); await canvas.scrollIntoViewIfNeeded();
    const rect = await canvas.boundingBox();
    await page.mouse.move(rect.x + 30, rect.y + 30); await page.mouse.down();
    await page.mouse.move(rect.x + 120, rect.y + 80, { steps: 6 }); await page.mouse.up();
    assert(await page.evaluate(() => historyIndex > 0));
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    assert.equal(await page.evaluate(() => historyIndex), 0);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    assert.equal(await page.evaluate(() => historyIndex), 1);
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    assert.equal(await page.evaluate(() => ctx.getImageData(60, 45, 1, 1).data[3]), 0);
  });
  await check('touch answer and reveal controls', async () => {
    const touch = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    const p = await touch.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(base + '/index.html');
    await p.locator('#boardAnswer').tap();
    await p.locator('#boardAnswer').fill('2');
    assert.equal(await p.locator('#longAnswer').inputValue(), '2');
    await p.locator('#longMainButton').tap();
    await p.locator('#longMainButton').tap();
    assert.equal(await p.evaluate(() => currentLongPart()), 'multiply');
    await p.getByRole('button', { name: 'Reveal', exact: true }).last().tap();
    await p.locator('#longMainButton').tap();
    assert.equal(await p.evaluate(() => currentLongPart()), 'subtract');
    await touch.close();
  });
  await check('offline cache includes V2 stylesheet and board script', async () => {
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true); await page.reload();
    await page.waitForFunction(() => !!document.querySelector('.division-board'));
    assert.equal(await page.locator('.divisor-tile').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 119, 122)');
    await page.evaluate(() => { revealLongStep(); handleLongMainAction(); });
    assert.equal(await page.evaluate(() => currentLongPart()), 'multiply');
    await context.setOffline(false);
  });
  await check('opens directly from local file', async () => {
    const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(pathToFileURL(path.join(root, 'index.html')).href);
    assert.equal(await p.locator('.divisor-tile').textContent(), '2'); await p.close();
  });
  await check('no runtime errors or external app requests', async () => { assert.deepEqual(errors, []); assert.deepEqual(external, []); });
  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify({ checked: '2026-11-07', browser: 'Windows Edge via shared Playwright', checks, errors, external }, null, 2) + '\n');
  console.log(`${checks.length} checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
