<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('outlet_product', function (Blueprint $table) {
            $table->decimal('harga', 15, 2)->nullable()->after('stok');
            $table->decimal('modal', 15, 2)->nullable()->after('harga');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('outlet_product', function (Blueprint $table) {
            $table->dropColumn(['harga', 'modal']);
        });
    }
};
