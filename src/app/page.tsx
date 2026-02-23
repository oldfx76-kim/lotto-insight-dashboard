"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { runLottoSimulation } from "@/lib/lotto-engine";
import { supabase } from "@/lib/supabase"; // 추가됨

export default function LottoDashboard() {
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const startSimulation = async () => {
    setResult([]); // 이전 결과 초기화
    setIsSimulating(true);
    const numbers = await runLottoSimulation((p) => setProgress(p));
    setResult(numbers);
    setIsSimulating(false);
  };

  // 번호를 데이터베이스에 저장하는 함수
  const saveNumbers = async () => {
    if (result.length === 0) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from('user_picks')
      .insert([{ numbers: result }]);

    if (error) {
      alert("저장 중 오류가 발생했습니다: " + error.message);
    } else {
      alert("번호가 성공적으로 저장되었습니다!");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Lotto Intelligence Dashboard
          </h1>
          <p className="text-slate-400">8,145,060번의 확률을 시뮬레이션한 결과입니다.</p>
        </header>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-200">Probability Simulator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            {isSimulating ? (
              <div className="w-full space-y-4 text-center">
                <p className="text-sm text-blue-400 animate-pulse">데이터 엔진 가동 중...</p>
                <Progress value={progress} className="h-2 bg-slate-800" />
                <span className="text-2xl font-mono">{progress}%</span>
              </div>
            ) : (
              <div className="flex gap-2 md:gap-4 flex-wrap justify-center">
                {(result.length > 0 ? result : [0, 0, 0, 0, 0, 0]).map((n, i) => (
                  <div key={i} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold border border-slate-700 text-emerald-400">
                    {n === 0 ? "?" : n}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-4 w-full justify-center">
              <Button 
                onClick={startSimulation} 
                disabled={isSimulating}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8"
              >
                시뮬레이션 시작
              </Button>

              {result.length > 0 && !isSimulating && (
                <Button 
                  onClick={saveNumbers} 
                  disabled={isSaving}
                  variant="outline"
                  className="border-emerald-500 text-emerald-400 hover:bg-emerald-950 px-8"
                >
                  {isSaving ? "저장 중..." : "번호 저장하기"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}