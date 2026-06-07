<?php

namespace App\Console\Commands;

use App\Models\Transaction;
use App\Models\HashVerification;
use Illuminate\Console\Command;

class RehashTransactions extends Command
{
    protected $signature = 'transactions:rehash';
    protected $description = 'Regenerasi semua hash SHA-256 transaksi dengan formula baru (termasuk metode_pembayaran)';

    public function handle()
    {
        $this->info('Memulai regenerasi hash untuk semua transaksi...');

        // Ambil semua outlet yang punya transaksi
        $outletIds = Transaction::distinct()->pluck('outlet_id');

        $totalUpdated = 0;

        foreach ($outletIds as $outletId) {
            $this->info("Proses outlet ID: {$outletId}");

            // Ambil transaksi sukses per outlet, urut ID asc (sesuai chain)
            $transactions = Transaction::where('outlet_id', $outletId)
                ->where('status', 'success')
                ->with('hashVerification')
                ->orderBy('id', 'asc')
                ->get();

            $previousHash = null;

            foreach ($transactions as $tx) {
                $signature = implode('|', [
                    $tx->transaction_code,
                    $tx->outlet_id,
                    $tx->total_amount,
                    $tx->metode_pembayaran,
                    $tx->created_at->timestamp,
                    $previousHash ?? '',
                ]);

                $newHash = hash('sha256', $signature);

                if ($tx->hashVerification) {
                    $tx->hashVerification->update([
                        'hash_sha256'   => $newHash,
                        'previous_hash' => $previousHash,
                        'status'        => 'verified',
                    ]);
                } else {
                    HashVerification::create([
                        'transaction_id' => $tx->id,
                        'hash_sha256'    => $newHash,
                        'previous_hash'  => $previousHash,
                        'status'         => 'verified',
                    ]);
                }

                $previousHash = $newHash;
                $totalUpdated++;
            }
        }

        $this->info("Selesai! {$totalUpdated} hash transaksi telah diperbarui.");
        return Command::SUCCESS;
    }
}
