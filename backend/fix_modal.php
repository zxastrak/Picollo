<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$items = App\Models\TransactionItem::all();
foreach ($items as $item) {
    $product = App\Models\Product::with('outlets')->find($item->product_id);
    if ($product) {
        $transaction = App\Models\Transaction::find($item->transaction_id);
        
        $hargaAkhir = $product->harga;
        $modalAkhir = $product->modal ?? 0;
        
        if ($transaction && $product->outlets->isNotEmpty()) {
            $pivot = $product->outlets->where('id', $transaction->outlet_id)->first()?->pivot;
            if ($pivot) {
                if ($pivot->harga !== null) $hargaAkhir = $pivot->harga;
                if ($pivot->modal !== null) $modalAkhir = $pivot->modal;
            }
        }
        
        $item->harga_satuan = $hargaAkhir;
        $item->modal_satuan = $modalAkhir;
        $item->subtotal = $hargaAkhir * $item->qty;
        $item->save();
        
        if ($transaction) {
            $transaction->total_amount = $transaction->items()->sum('subtotal');
            $transaction->save();
        }
        
        echo "Updated Item {$item->id} (Harga: {$hargaAkhir}, Modal: {$modalAkhir})\n";
    }
}
echo "Selesai menyesuaikan database lama.\n";
