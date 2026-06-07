<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$kasir = \App\Models\User::whereHas('roles', function($q){ $q->where('name', 'kasir'); })->first();
if ($kasir) {
    echo $kasir->createToken('test')->accessToken;
} else {
    echo "No kasir found";
}
