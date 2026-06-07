<?php

namespace App\Services;

use App\Models\CorrectionLog;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class FraudDetectionService
{
    /**
     * Analyze a correction request for behavioral fraud patterns.
     *
     * @param Transaction $transaction The transaction being corrected
     * @param int $userId The ID of the user performing the correction
     * @return array Returns an array of fraud indicator strings. Empty if clean.
     */
    public function analyzeCorrection(Transaction $transaction, int $userId): array
    {
        $indicators = [];
        $now = Carbon::now();

        // 1. Late Correction (Koreksi > 1 Menit setelah transaksi berhasil)
        $diffInSeconds = $transaction->created_at->diffInSeconds($now);
        if ($diffInSeconds > 60) {
            $minutes = floor($diffInSeconds / 60);
            $indicators[] = "Koreksi terlambat ({$minutes} menit setelah transaksi)";
        }

        // 2. End of Shift Anomaly (Koreksi di jam 21:00 - 23:59)
        $hour = $now->hour;
        if ($hour >= 21 && $hour <= 23) {
            $indicators[] = "Koreksi dilakukan di akhir shift (Pukul {$hour}:{$now->format('i')})";
        }

        // 3. Rapid Succession (Koreksi berturut-turut > 2 dalam 5 menit)
        $fiveMinutesAgo = $now->copy()->subMinutes(5);
        $recentCorrections = CorrectionLog::where('corrected_by', $userId)
            ->where('created_at', '>=', $fiveMinutesAgo)
            ->count();
        
        if ($recentCorrections >= 2) {
            $indicators[] = "Koreksi berturut-turut sangat cepat ({$recentCorrections} kali dalam 5 menit terakhir)";
        }

        // 4. High Daily Volume (Banyak koreksi tiba-tiba > 3 sehari)
        $todayCorrections = CorrectionLog::where('corrected_by', $userId)
            ->whereDate('created_at', $now->toDateString())
            ->count();
            
        if ($todayCorrections >= 3) {
            $indicators[] = "Volume koreksi harian tinggi (Sudah {$todayCorrections} kali koreksi hari ini)";
        }

        // 5. Pattern History (Sering koreksi di jam yang sama pada hari beruntun)
        // Kita cek hari kemarin di jam yang sama (plus minus 1 jam)
        $yesterday = $now->copy()->subDay();
        $startHour = $yesterday->copy()->subHour();
        $endHour = $yesterday->copy()->addHour();
        
        $yesterdayPattern = CorrectionLog::where('corrected_by', $userId)
            ->whereBetween('created_at', [$startHour, $endHour])
            ->exists();
            
        if ($yesterdayPattern) {
            $indicators[] = "Pola waktu mencurigakan (Kemarin juga melakukan koreksi di sekitar jam {$hour})";
        }

        if (!empty($indicators)) {
            Log::warning("Behavioral Fraud Detected for user {$userId} on transaction {$transaction->transaction_code}", $indicators);
        }

        return $indicators;
    }
}
