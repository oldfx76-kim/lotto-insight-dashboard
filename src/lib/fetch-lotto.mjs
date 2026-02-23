import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchLatestLotto() {
  try {
    // 1. DB에서 가장 최신 회차 찾기
    const { data: lastEntry } = await supabase
      .from('lotto_history')
      .select('draw_no')
      .order('draw_no', { ascending: false })
      .limit(1);

    // 테이블이 비어있으면 1140회부터, 있으면 다음 회차부터 시작
    const targetDrawNo = (lastEntry && lastEntry.length > 0) ? lastEntry[0].draw_no + 1 : 1140;
    
    console.log(`📡 [안전 모드] ${targetDrawNo}회차 데이터 수집 시도...`);

    const res = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${targetDrawNo}`);
    const data = await res.json();

    if (data && data.returnValue === 'success') {
      const { error } = await supabase.from('lotto_history').upsert({
        draw_no: data.drwNo,
        draw_date: data.drwNoDate,
        nums: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
        bonus_no: data.bnusNo
      });

      if (error) throw error;
      console.log(`✅ ${data.drwNo}회차 저장 완료!`);
    } else {
      console.log(`🏁 ${targetDrawNo}회차는 아직 발표 전이거나 API가 응답하지 않습니다.`);
    }
  } catch (err) {
    console.error('❌ 에러 발생:', err.message);
  }
}

fetchLatestLotto();