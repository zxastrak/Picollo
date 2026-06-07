<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add missing columns to 'users'
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'no_telepon')) {
                $table->string('no_telepon')->nullable();
            }
            if (!Schema::hasColumn('users', 'avatar_url')) {
                $table->string('avatar_url')->nullable();
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable();
            }
        });

        // 2. outlets
        if (!Schema::hasTable('outlets')) {
            Schema::create('outlets', function (Blueprint $table) {
                $table->id();
                $table->string('nama');
                $table->string('alamat')->nullable();
                $table->string('kota')->nullable();
                $table->string('kode_outlet')->unique();
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        // 3. admin_outlet (pivot)
        if (!Schema::hasTable('admin_outlet')) {
            Schema::create('admin_outlet', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('outlet_id')->constrained('outlets')->onDelete('cascade');
                $table->timestamps();
            });
        }

        // 4. products
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('outlet_id')->nullable()->constrained('outlets')->onDelete('cascade');
                $table->string('nama');
                $table->string('kategori')->nullable();
                $table->decimal('harga', 15, 2);
                $table->string('satuan')->default('pcs');
                $table->integer('stok')->default(0);
                $table->string('gambar_url')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 5. transactions
        if (!Schema::hasTable('transactions')) {
            Schema::create('transactions', function (Blueprint $table) {
                $table->id();
                $table->string('transaction_code')->unique();
                $table->foreignId('outlet_id')->constrained('outlets')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->decimal('total_amount', 15, 2);
                $table->string('metode_pembayaran');
                $table->string('payment_reference')->nullable();
                $table->string('status');
                $table->text('catatan')->nullable();
                $table->timestamps();
            });
        }

        // 6. transaction_items
        if (!Schema::hasTable('transaction_items')) {
            Schema::create('transaction_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('transaction_id')->constrained('transactions')->onDelete('cascade');
                $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
                $table->string('nama_produk');
                $table->decimal('harga_satuan', 15, 2);
                $table->integer('qty');
                $table->decimal('subtotal', 15, 2);
                $table->timestamps();
            });
        }

        // 7. audit_logs
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
                $table->string('action');
                $table->string('entity_type');
                $table->unsignedBigInteger('entity_id');
                $table->json('old_value')->nullable();
                $table->json('new_value')->nullable();
                $table->string('ip_address')->nullable();
                $table->string('user_agent')->nullable();
                $table->timestamps();
            });
        }

        // 8. correction_logs
        if (!Schema::hasTable('correction_logs')) {
            Schema::create('correction_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('transaction_id')->constrained('transactions')->onDelete('cascade');
                $table->foreignId('corrected_by')->constrained('users')->onDelete('cascade');
                $table->foreignId('outlet_id')->constrained('outlets')->onDelete('cascade');
                $table->foreignId('audit_log_id')->nullable()->constrained('audit_logs')->onDelete('set null');
                $table->text('alasan');
                $table->json('new_data');
                $table->string('correction_type');
                $table->string('hash_sebelum')->nullable();
                $table->string('hash_sesudah')->nullable();
                $table->string('status')->default('pending');
                $table->timestamps();
            });
        }

        // 9. hash_verifications
        if (!Schema::hasTable('hash_verifications')) {
            Schema::create('hash_verifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('transaction_id')->constrained('transactions')->onDelete('cascade');
                $table->string('hash_sha256');
                $table->string('previous_hash')->nullable();
                $table->string('status');
                $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamp('verified_at')->nullable();
                $table->timestamps();
            });
        }

        // 10. daily_recaps
        if (!Schema::hasTable('daily_recaps')) {
            Schema::create('daily_recaps', function (Blueprint $table) {
                $table->id();
                $table->foreignId('outlet_id')->constrained('outlets')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->date('tanggal');
                $table->integer('total_transaksi');
                $table->decimal('total_amount', 15, 2);
                $table->decimal('total_qris', 15, 2)->default(0);
                $table->decimal('total_tunai', 15, 2)->default(0);
                $table->string('hash_rekap')->nullable();
                $table->string('status')->default('draft');
                $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamp('submitted_at')->nullable();
                $table->text('catatan')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_recaps');
        Schema::dropIfExists('hash_verifications');
        Schema::dropIfExists('correction_logs');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('transaction_items');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('products');
        Schema::dropIfExists('admin_outlet');
        Schema::dropIfExists('outlets');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['no_telepon', 'avatar_url', 'is_active', 'last_login_at']);
        });
    }
};
