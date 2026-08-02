/* Minimal quiz widget. Immediate feedback, no scoring server, works offline.
 *
 * Usage in a lesson:
 *   <div class="quiz" id="recall"></div>
 *   <script src="../assets/quiz.js"></script>
 *   <script>
 *     Quiz.render('recall', [
 *       {
 *         stem: 'Question text?',
 *         options: ['Alpha option', 'Bravo option', 'Charlie option'],
 *         answer: 1,                       // index into options
 *         why: 'Shown after any click.'    // explanation
 *       }
 *     ]);
 *   </script>
 *
 * Keep all options for a question the same word count so length gives no clue.
 */
window.Quiz = (function () {
  function render(containerId, questions) {
    var root = document.getElementById(containerId);
    if (!root) return;
    questions.forEach(function (q, qi) {
      var box = document.createElement('div');
      box.className = 'q';

      var stem = document.createElement('p');
      stem.className = 'stem';
      stem.textContent = (qi + 1) + '. ' + q.stem;
      box.appendChild(stem);

      var feedback = document.createElement('p');
      feedback.className = 'feedback';

      q.options.forEach(function (opt, oi) {
        var btn = document.createElement('button');
        btn.className = 'opt';
        btn.type = 'button';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          if (box.dataset.done) return;
          box.dataset.done = '1';
          var buttons = box.querySelectorAll('button.opt');
          buttons[q.answer].classList.add('correct');
          if (oi !== q.answer) btn.classList.add('wrong');
          feedback.textContent = (oi === q.answer ? 'Correct. ' : 'Not quite. ') + (q.why || '');
          feedback.classList.add('shown');
        });
        box.appendChild(btn);
      });

      box.appendChild(feedback);
      root.appendChild(box);
    });
  }
  return { render: render };
})();
