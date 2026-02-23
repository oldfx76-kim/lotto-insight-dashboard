import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchLatestLotto() {
  try {
    // 1. DB에서 가장 최근 회차 가져오기
    const { data: lastEntry } = await supabase
      .from('lotto_history')
      .select('draw_no')
      .order('draw_no', { ascending: false })
      .limit(1);

    const nextDrawNo = lastEntry && lastEntry.length > 0 ? lastEntry[0].draw_no + 1 : 1150;
    
    console.log(`${nextDrawNo}회차 데이터 수집 시도...`);

    const res = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${nextDrawNo}`);
    const data = await res.json();

    if (data.returnValue === 'success') {
      const { error } = await supabase.from('lotto_history').upsert({
        draw_no: data.drwNo,
        draw_date: data.drwNoDate,
        nums: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
        bonus_no: data.bnusNo
      });
      if (error) throw error;
      console.log(`${data.drwNo}회차 저장 완료!`);
    } else {
      console.log("아직 이번 주 당첨 번호가 발표되지 않았거나 회차 정보가 없습니다.");
    }
  } catch (err) {
    console.error('에러 발생:', err.message);
  }
}

fetchLatestLotto();