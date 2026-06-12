<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\ReportController;

$kasir = User::role('kasir')->first();
if (!$kasir) {
    echo "No cashier found in database!\n";
    exit;
}

echo "Testing as cashier: {$kasir->email} (ID: {$kasir->id})\n";

$request = Request::create('/api/reports', 'GET', [
    'start_date' => date('Y-m-d'),
    'end_date'   => date('Y-m-d'),
]);
$request->setUserResolver(fn() => $kasir);

try {
    $controller = new ReportController();
    $response = $controller->index($request);
    echo "Status code: " . $response->getStatusCode() . "\n";
    echo "Response: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
