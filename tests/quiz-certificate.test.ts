import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Quiz Evaluation & Certificate Issuance Logic', () => {
  const TOTAL_QUESTIONS = 20;
  const PASSING_PERCENTAGE = 70; // 14 out of 20 correct answers required

  function evaluateQuiz(score: number): {
    scorePercentage: number;
    isPassed: boolean;
    grade: 'Distinction' | 'Merit' | 'Pass' | 'Fail';
  } {
    const scorePercentage = Math.round((score / TOTAL_QUESTIONS) * 100);
    const isPassed = scorePercentage >= PASSING_PERCENTAGE;

    let grade: 'Distinction' | 'Merit' | 'Pass' | 'Fail' = 'Fail';
    if (scorePercentage >= 90) grade = 'Distinction';
    else if (scorePercentage >= 80) grade = 'Merit';
    else if (scorePercentage >= 70) grade = 'Pass';

    return { scorePercentage, isPassed, grade };
  }

  function generateCertificateNumber(): string {
    const codeRandom = Math.floor(1000 + Math.random() * 9000);
    return `VIAR-2026-WIA-${codeRandom}`;
  }

  it('should grant Distinction grade for score >= 90%', () => {
    const res = evaluateQuiz(18); // 18 / 20 = 90%
    assert.strictEqual(res.scorePercentage, 90);
    assert.strictEqual(res.isPassed, true);
    assert.strictEqual(res.grade, 'Distinction');
  });

  it('should grant Merit grade for score between 80% and 89%', () => {
    const res = evaluateQuiz(16); // 16 / 20 = 80%
    assert.strictEqual(res.scorePercentage, 80);
    assert.strictEqual(res.isPassed, true);
    assert.strictEqual(res.grade, 'Merit');
  });

  it('should grant Pass grade for score between 70% and 79%', () => {
    const res = evaluateQuiz(14); // 14 / 20 = 70%
    assert.strictEqual(res.scorePercentage, 70);
    assert.strictEqual(res.isPassed, true);
    assert.strictEqual(res.grade, 'Pass');
  });

  it('should fail when score is below 70%', () => {
    const res = evaluateQuiz(13); // 13 / 20 = 65%
    assert.strictEqual(res.scorePercentage, 65);
    assert.strictEqual(res.isPassed, false);
    assert.strictEqual(res.grade, 'Fail');
  });

  it('should generate valid certificate format VIAR-2026-WIA-XXXX', () => {
    const certCode = generateCertificateNumber();
    const certRegex = /^VIAR-2026-WIA-\d{4}$/;
    assert.match(certCode, certRegex, 'Certificate number must match standard format');
  });

  it('should lock quiz if prerequisite sessions are not all attended or watched', () => {
    function isQuizUnlocked(completedSessions: number, totalSessions: number): boolean {
      return completedSessions >= totalSessions;
    }

    assert.strictEqual(isQuizUnlocked(17, 18), false, 'Must be locked when 17 of 18 completed');
    assert.strictEqual(isQuizUnlocked(18, 18), true, 'Must unlock when all 18 completed');
    assert.strictEqual(isQuizUnlocked(0, 18), false, 'Must be locked at 0 completed');
  });
});
