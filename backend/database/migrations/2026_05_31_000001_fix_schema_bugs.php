<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migration ini memperbaiki 2 critical bug di schema database:
 * 
 * 1. Tambah nilai 'voided' ke enum hash_verifications.status
 *    (sebelumnya hanya: pending, verified, fraud_detected)
 * 
 * 2. Tambah kolom old_data ke tabel correction_logs
 *    (kolom ini dipakai di CorrectionLogController tapi tidak ada di schema)
 * 
 * Jalankan dengan: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        // FIX 1: Tambah 'voided' ke enum hash_verifications.status
        // MySQL tidak support Schema::table untuk modify enum langsung,
        // harus pakai raw SQL
        DB::statement("
            ALTER TABLE hash_verifications 
            MODIFY COLUMN status 
            ENUM('pending','verified','fraud_detected','voided') 
            NOT NULL DEFAULT 'pending'
        ");

        // FIX 2: Tambah kolom old_data ke correction_logs
        // Kolom ini diperlukan untuk menyimpan snapshot data sebelum koreksi
        Schema::table('correction_logs', function (Blueprint $table) {
            // Tambahkan setelah kolom alasan, sebelum new_data
            $table->json('old_data')->nullable()->after('alasan');
        });
    }

    public function down(): void
    {
        // Rollback: hapus 'voided' dari enum
        DB::statement("
            ALTER TABLE hash_verifications 
            MODIFY COLUMN status 
            ENUM('pending','verified','fraud_detected') 
            NOT NULL DEFAULT 'pending'
        ");

        // Rollback: hapus kolom old_data
        Schema::table('correction_logs', function (Blueprint $table) {
            $table->dropColumn('old_data');
        });
    }
};