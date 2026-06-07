<?php
$cl = App\Models\CorrectionLog::with('transaction.hashVerification')->find(5);
$old = $cl->old_data;
$new = $cl->new_data;
$hv = $cl->transaction->hashVerification;

echo "OLD metode: " . ($old['metode_pembayaran'] ?? 'null') . "\n";
echo "NEW metode: " . ($new['metode_pembayaran'] ?? 'null') . "\n";
echo "OLD total: " . ($old['total_amount'] ?? 'null') . "\n";
echo "NEW total: " . ($new['total_amount'] ?? 'null') . "\n";
echo "Previous hash: " . ($hv->previous_hash ?? 'null') . "\n";
echo "Tx code: " . $cl->transaction->transaction_code . "\n";
echo "Outlet: " . $cl->transaction->outlet_id . "\n";
echo "Timestamp: " . $cl->transaction->created_at->timestamp . "\n";
