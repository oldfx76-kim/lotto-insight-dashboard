import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchLottoData(drawNo) {
  try {
    const res = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`);
    const text = await res.text(); // 먼저 텍스트로 받아서 확인
    
    // 응답이 HTML 형식이면 실패로 간주
    if (text.includes('<!DOCTYPE')) {
      return { returnValue: 'fail', reason: 'HTML_RESPONSE' };
    }
    
    return JSON.parse(text);
  } catch (e) {
    return { returnValue: 'fail', reason: e.message };
  }
}

async function syncLottoHistory() {
  try {
    console.log("🚀 로또 데이터 동기화 엔진 가동...");

    const { data: lastEntry } = await supabase
      .from('lotto_history')
      .select('draw_no')
      .order('draw_no', { ascending: false })
      .limit(1);

    // 데이터가 없으면 1145회부터 시작 (범위를 조금 좁혀 안정성 확보)
    let currentDrawNo = (lastEntry && lastEntry.length > 0) ? lastEntry[0].draw_no + 1 : 1145;

    while (true) {
      console.log(`📡 ${currentDrawNo}회차 데이터 수집 시도...`);
      const data = await fetchLottoData(currentDrawNo);

      if (data && data.returnValue === 'success') {
        const { error } = await supabase.from('lotto_history').upsert({
          draw_no: data.drwNo,
          draw_date: data.drwNoDate,
          nums: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
          bonus_no: data.bnusNo
        });

        if (error) throw error;
        console.log(`✅ ${data.drwNo}회차 저장 완료!`);
        
        currentDrawNo++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 휴식 시간 1초로 연장
      } else {
        console.log(`🏁 수집 종료: ${currentDrawNo}회차 정보가 없거나 API 제한에 걸렸습니다.`);
        break; 
      }
    }
  } catch (err) {
    console.error('❌ 최종 에러 발생:', err.message);
  }
}

syncLottoHistory();