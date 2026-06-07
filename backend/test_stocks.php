<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Outlet;

$outlet = Outlet::find(18);
if (!$outlet) {
    die("Outlet 18 not found.\n");
}

echo "Outlet: " . $outlet->nama . "\n";
foreach ($outlet->products as $product) {
    echo "Product: " . $product->nama . " (ID: " . $product->id . ") - Stock: " . $product->pivot->stok . "\n";
}
