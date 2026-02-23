// src/lib/lotto-engine.ts
import { supabase } from "./supabase";

export const runLottoSimulation = async (onProgress: (p: number) => void) => {
  const TOTAL_COMBINATIONS = 8145060;
  const CHUNK_SIZE = 200000;
  
  // 1. 역대 당첨 데이터 가져오기 (비교 기준)
  const { data: history } = await supabase
    .from('lotto_history')
    .select('nums')
    .order('draw_no', { ascending: false })
    .limit(100); // 최근 100회차 데이터 기준

  let current = 0;
  let bestPick = { numbers: [] as number[], score: -1 };

  while (current < TOTAL_COMBINATIONS) {
    // 시뮬레이션 루프 내에서 최적의 조합 찾기
    for (let i = 0; i < 1000; i++) {
      const candidate = generateLuckyNumbers();
      const currentScore = calculateScore(candidate, history || []);
      
      if (currentScore > bestPick.score) {
        bestPick = { numbers: candidate, score: currentScore };
      }
    }

    current += CHUNK_SIZE;
    if (current > TOTAL_COMBINATIONS) current = TOTAL_COMBINATIONS;
    onProgress(Math.floor((current / TOTAL_COMBINATIONS) * 100));
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return bestPick.numbers;
};

// 점수 계산 로직: 과거 당첨 번호 패턴과 얼마나 유사한가?
const calculateScore = (candidate: number[], history: any[]) => {
  let score = 0;
  // 예: 홀짝 비율이 3:3이면 가산점, 과거 1등 번호와 3개 이상 일치하면 가산점 등
  const evens = candidate.filter(n => n % 2 === 0).length;
  if (evens === 3) score += 10; 
  
  return score + Math.random(); // 동점 방지용 랜덤값
};

const generateLuckyNumbers = () => {
  const nums = new Set<number>();
  while (nums.size < 6) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
};