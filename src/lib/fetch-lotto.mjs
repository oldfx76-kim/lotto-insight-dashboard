import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchLottoData(drawNo) {
  const res = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`);
  const data = await res.json();
  return data;
}

async function syncLottoHistory() {
  try {
    console.log("🚀 로또 데이터 동기화 엔진 가동...");

    // 1. DB에서 가장 높은 회차 가져오기
    const { data: lastEntry } = await supabase
      .from('lotto_history')
      .select('draw_no')
      .order('draw_no', { ascending: false })
      .limit(1);

    // 데이터가 없으면 1140회부터 시작 (범위를 넓혔습니다), 있으면 다음 회차부터 시작
    let currentDrawNo = (lastEntry && lastEntry.length > 0) ? lastEntry[0].draw_no + 1 : 1140;

    while (true) {
      console.log(`📡 ${currentDrawNo}회차 데이터 수집 중...`);
      const data = await fetchLottoData(currentDrawNo);

      if (data.returnValue === 'success') {
        const { error } = await supabase.from('lotto_history').upsert({
          draw_no: data.drwNo,
          draw_date: data.drwNoDate,
          nums: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
          bonus_no: data.bnusNo
        });

        if (error) throw error;
        console.log(`✅ ${data.drwNo}회차 저장 완료!`);
        
        currentDrawNo++; // 다음 회차로 이동
        // API 과부하 방지를 위한 짧은 휴식 (0.5초)
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`🏁 수집 완료: ${currentDrawNo}회차는 아직 발표되지 않았습니다.`);
        break; // 최신 회차까지 도달하면 루프 종료
      }
    }
  } catch (err) {
    console.error('❌ 에러 발생:', err.message);
  }
}

syncLottoHistory();