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
        Schema::create('outlet_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            // Prevent duplicate entries
            $table->unique(['outlet_id', 'product_id']);
        });

        // Migrate existing data from products to outlet_product
        $products = DB::table('products')->whereNotNull('outlet_id')->get();
        foreach ($products as $product) {
            DB::table('outlet_product')->insert([
                'outlet_id' => $product->outlet_id,
                'product_id' => $product->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Drop the outlet_id column from products
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['outlet_id']);
            $table->dropColumn('outlet_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back outlet_id to products
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('outlet_id')->nullable()->constrained()->cascadeOnDelete();
        });

        // Restore data from pivot to products
        // (Note: Since it's many-to-many, we'll just pick the first outlet for down migration)
        $pivotRecords = DB::table('outlet_product')->get();
        foreach ($pivotRecords as $record) {
            DB::table('products')
                ->where('id', $record->product_id)
                ->whereNull('outlet_id')
                ->update(['outlet_id' => $record->outlet_id]);
        }

        Schema::dropIfExists('outlet_product');
    }
};
