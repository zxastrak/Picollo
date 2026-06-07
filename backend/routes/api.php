<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OutletController;
use App\Http\Controllers\Api\KasirController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\DailyRecapController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\CorrectionLogController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\HashVerificationController;
use App\Http\Controllers\Api\AuditorController;


// Public routes — dengan throttle untuk keamanan
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/register',        [AuthController::class, 'register']);
    Route::post('/login',           [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
    Route::post('/verify-email',    [AuthController::class, 'verifyEmail']);
    Route::post('/resend-otp',      [AuthController::class, 'resendOtp']);
});

// Protected routes
Route::middleware('auth:api')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::get('/me',       [AuthController::class, 'me']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::post('/auth/profile',                        [AuthController::class, 'updateProfile']);
        Route::get('/dashboard/admin',                      [DashboardController::class, 'adminDashboard']);
        Route::get('/notifications',                        [DashboardController::class, 'notifications']);
        Route::apiResource('/outlets',                      OutletController::class);
        
        // Atur menu & stok outlet
        Route::get('/outlets/{id}/products', [OutletController::class, 'getProducts']);
        Route::post('/outlets/{id}/products', [OutletController::class, 'syncProducts']);

        Route::apiResource('/kasir',                        KasirController::class)->except(['index', 'show']);
        Route::apiResource('/auditors',                     AuditorController::class);
        Route::apiResource('/products',                     ProductController::class)->except(['index', 'show']);
        Route::patch('/daily-recaps/{id}/approve',          [DailyRecapController::class, 'approve']);
        Route::patch('/correction-logs/{id}/approve',       [CorrectionLogController::class, 'approve']);
        Route::post('/hash-verifications/verify-chain',     [HashVerificationController::class, 'verifyChain']);
    });

    // Admin & Kasir
    Route::middleware('role:admin|kasir')->group(function () {
        Route::get('/products',                             [ProductController::class, 'index']);
        Route::get('/products/{id}',                        [ProductController::class, 'show']);
        Route::post('/transactions',                        [TransactionController::class, 'store']);
        Route::post('/daily-recaps',                        [DailyRecapController::class, 'store']);
        Route::post('/correction-logs',                     [CorrectionLogController::class, 'store']);
    });

    // Admin, Kasir & Auditor (Read-only access to transactions and daily recaps)
    Route::middleware('role:admin|kasir|auditor')->group(function () {
        Route::get('/transactions',                         [TransactionController::class, 'index']);
        Route::get('/transactions/{id}',                    [TransactionController::class, 'show']);
        Route::get('/daily-recaps',                         [DailyRecapController::class, 'index']);
        Route::get('/daily-recaps/{id}',                    [DailyRecapController::class, 'show']);
        Route::get('/reports',                              [ReportController::class, 'index']);
    });

    // Admin & Auditor (Access to audits, reports, cashier list, and correction logs list)
    Route::middleware('role:admin|auditor')->group(function () {
        Route::get('/reports/export-pdf',                   [ReportController::class, 'exportPdf']);
        Route::get('/reports/export-excel',                 [ReportController::class, 'exportExcel']);
        Route::get('/hash-verifications',                   [HashVerificationController::class, 'index']);
        Route::get('/hash-verifications/{id}',              [HashVerificationController::class, 'show']);
        Route::post('/hash-verifications/verify',           [HashVerificationController::class, 'verify']);
        Route::post('/hash-verifications/verify-by-hash',   [HashVerificationController::class, 'verifyByHash']);
        Route::get('/audit-logs',                           [AuditLogController::class, 'index']);
        Route::get('/correction-logs',                      [CorrectionLogController::class, 'index']);
        Route::get('/kasir',                                [KasirController::class, 'index']);
        Route::get('/kasir/{id}',                           [KasirController::class, 'show']);
        Route::get('/kasir/{id}/aktivitas',                 [KasirController::class, 'getActivities']);
    });
});