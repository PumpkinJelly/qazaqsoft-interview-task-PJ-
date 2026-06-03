let currentQuestion = 0;
let answers = {};
let timer = 600;
let timerInterval;
let questionData = null;
let isFinished = false;

async function loadQuest() {
  const response = await fetch('data/questions.json');
  questionData = await response.json();
  
  timer = questionData.timeLimitSec || 300;

  const saved = localStorage.getItem('quizProgress');
  if (saved) {
    const data = JSON.parse(saved);
    currentQuestion = data.currentQuestion || 0;
    answers = data.answers || {};
    timer = data.timeLeft || timer;
  }

  startTimer();
  showQuestion();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    updateTimer();

    if (timer <= 0) {
      clearInterval(timerInterval);
      finishTest();
    }
  }, 1000);
}

function updateTimer() {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  document.getElementById("time-left").textContent = 
    `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function showQuestion() {
  if (!questionData) return;

  const q = questionData.questions[currentQuestion];
  const total = questionData.questions.length;

  document.getElementById("progress").textContent = 
    `Вопрос ${currentQuestion + 1} из ${total}`;

  document.getElementById("question-text").innerHTML = `<p>${q.text}</p>`;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = '';

  q.options.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = 'option-btn';
    btn.textContent = answer;
    btn.onclick = () => selectAnswer(index);

    
    if (answers[currentQuestion] === index) { // востановление
      btn.classList.add('selected');
    }

    optionsDiv.appendChild(btn);
  });

  document.getElementById("btn-back").disabled = currentQuestion === 0;
  document.getElementById("btn-next").style.display = 
    currentQuestion === total - 1 ? 'none' : 'inline-block';
  document.getElementById('btn-finish').style.display = 
    currentQuestion === total - 1 ? 'inline-block' : 'none';
}

function selectAnswer(index) {
  answers[currentQuestion] = index;
  saveProgress();
  showQuestion();
}

function nextQuestion() {
  if (currentQuestion < questionData.questions.length - 1) {
    currentQuestion++;
    showQuestion();
    saveProgress();
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
  }
}

function finishTest() {
  clearInterval(timerInterval);
  isFinished = true;
  saveProgress();

  document.getElementById('quiz-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  showResults();
}

function showResults() {
  const total = questionData.questions.length;
  let correct = 0;

  questionData.questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct++;
  });

  const percentage = Math.round((correct / total) * 100);
  const passed = percentage >= (questionData.passThreshold * 100 || 70);

  document.getElementById('score-text').textContent = 
    `Правильных ответов: ${correct} из ${total}`;

  document.getElementById("percentage").textContent = `${percentage}%`;

  const statusEl = document.getElementById("status");
  statusEl.textContent = passed ? 'Пройден' : 'Не пройден';
  statusEl.className = passed ? 'status passed' : 'status failed';
}

function saveProgress() {
  const progress = {
    currentQuestion,
    answers,
    timeLeft: timer
  };
  localStorage.setItem('quizProgress', JSON.stringify(progress));
}

document.getElementById('btn-next').onclick = nextQuestion;
document.getElementById('btn-back').onclick = prevQuestion;
document.getElementById('btn-finish').onclick = finishTest;

document.getElementById("btn-restart").onclick = () => {
  localStorage.removeItem('quizProgress');
  location.reload();
};

loadQuest();
