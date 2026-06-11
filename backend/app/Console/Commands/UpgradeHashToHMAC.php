<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Transaction;
use App\Models\HashVerification;
use Illuminate\Support\Facades\DB;

class UpgradeHashToHMAC extends Command
{
    protected $signature = 'hash:upgrade';
    protected $description = 'Upgrade all existing SHA256 hashes to HMAC using APP_KEY';

    public function handle()
    {
        $this->info('Starting hash upgrade to HMAC...');

        $outlets = Transaction::select('outlet_id')->distinct()->get();

        DB::beginTransaction();
        try {
            foreach ($outlets as $outlet) {
                $transactions = Transaction::where('outlet_id', $outlet->outlet_id)
                    ->where('status', 'success')
                    ->orderBy('id', 'asc')
                    ->get();

                $previousHash = null;

                foreach ($transactions as $transaction) {
                    $verification = HashVerification::firstOrNew([
                        'transaction_id' => $transaction->id,
                    ]);

                    $signature = implode('|', [
                        $transaction->transaction_code,
                        $transaction->outlet_id,
                        $transaction->total_amount,
                        $transaction->metode_pembayaran,
                        $transaction->created_at->timestamp,
                        $previousHash ?? '',
                    ]);

                    $newHash = hash_hmac('sha256', $signature, config('app.key'));

                    $verification->hash_sha256 = $newHash;
                    $verification->previous_hash = $previousHash;
                    $verification->status = 'verified';
                    $verification->save();

                    $previousHash = $newHash;
                }
            }

            DB::commit();
            $this->info('Successfully upgraded all hashes to HMAC.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Failed to upgrade hashes: ' . $e->getMessage());
        }
    }
}
