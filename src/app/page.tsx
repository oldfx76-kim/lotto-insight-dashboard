"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { runLottoSimulation } from "@/lib/lotto-engine";
import { supabase } from "@/lib/supabase";

export default function LottoDashboard() {
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<number[]>([]);
  const [savedPicks, setSavedPicks] = useState<any[]>([]);
  const [winHistory, setWinHistory] = useState<any[]>([]);

  // 1. 데이터 불러오기 (저장된 번호 & 역대 당첨 번호)
  const fetchData = async () => {
    const { data: picks } = await supabase.from('user_picks').select('*').order('created_at', { ascending: false });
    const { data: history } = await supabase.from('lotto_history').select('*').order('draw_no', { ascending: false }).limit(5);
    setSavedPicks(picks || []);
    setWinHistory(history || []);
  };

  useEffect(() => { fetchData(); }, []);

  const startSimulation = async () => {
    setIsSimulating(true);
    const numbers = await runLottoSimulation((p) => setProgress(p));
    setResult(numbers);
    setIsSimulating(false);
    fetchData(); // 자동 갱신
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center md:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Lotto Intelligence Dashboard
          </h1>
          <p className="text-slate-400 mt-2">1/8,145,060 확률 시뮬레이션 및 데이터 분석</p>
        </header>

        {/* 시뮬레이션 섹션 */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader><CardTitle className="text-blue-400">Probability Simulator</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {isSimulating ? (
              <div className="w-full space-y-4">
                <Progress value={progress} className="h-2" />
                <p className="text-center font-mono">{progress}% 분석 중...</p>
              </div>
            ) : (
              <div className="flex gap-2">
                {(result.length > 0 ? result : [0,0,0,0,0,0]).map((n, i) => (
                  <div key={i} className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-emerald-400">
                    {n || "?"}
                  </div>
                ))}
              </div>
            )}
            <Button onClick={startSimulation} disabled={isSimulating} className="w-full md:w-auto px-12 bg-blue-600">
              시뮬레이션 가동
            </Button>
          </CardContent>
        </Card>

        {/* 내 저장 번호 분석 성적표 */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-emerald-400">⭐ 내 저장 번호 분석</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedPicks.length > 0 ? savedPicks.map((pick, idx) => (
                <div key={idx} className="flex flex-col md:flex-row justify-between items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700 gap-4">
                  <div className="flex gap-2">
                    {pick.numbers.map((n: number) => (
                      <span key={n} className="text-sm font-mono bg-slate-900 px-2 py-1 rounded border border-slate-700">{n}</span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(pick.created_at).toLocaleDateString()} 저장됨</div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-lg">
                  저장된 번호가 없습니다. 시뮬레이션을 시작해 보세요!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}