import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchSafeLotto() {
  try {
    // 1. DB에서 마지막 회차 확인
    const { data: lastEntry } = await supabase
      .from('lotto_history')
      .select('draw_no')
      .order('draw_no', { ascending: false })
      .limit(1);

    // 데이터가 없으면 1140회부터, 있으면 다음 회차 1개만 타겟팅
    const targetNo = (lastEntry && lastEntry.length > 0) ? lastEntry[0].draw_no + 1 : 1140;
    
    console.log(`🛡️ [보안 안전 모드] ${targetNo}회차 수집 시도...`);

    const res = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${targetNo}`);
    const text = await res.text();

    // HTML 응답인지 확인 (차단 여부 체크)
    if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
      console.log("❌ API 서버가 현재 요청을 차단했습니다. 잠시 후 다시 시도해야 합니다.");
      return;
    }

    const data = JSON.parse(text);

    if (data && data.returnValue === 'success') {
      await supabase.from('lotto_history').upsert({
        draw_no: data.drwNo,
        draw_date: data.drwNoDate,
        nums: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
        bonus_no: data.bnusNo
      });
      console.log(`✅ ${data.drwNo}회차 저장 완료!`);
    } else {
      console.log(`🏁 ${targetNo}회차는 아직 발표되지 않았습니다.`);
    }
  } catch (err) {
    console.error('❌ 최종 단계 에러:', err.message);
  }
}

fetchSafeLotto();