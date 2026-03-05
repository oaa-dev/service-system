<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create loyalty_program_tiers table
        Schema::create('loyalty_program_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loyalty_program_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('required_stamps');
            $table->enum('reward_type', ['free_product', 'discount_percentage', 'discount_fixed']);
            $table->decimal('reward_value', 10, 2)->nullable();
            $table->foreignId('reward_product_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('reward_description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('loyalty_program_id');
        });

        // 2. Migrate existing reward data from programs to tiers
        $programs = DB::table('loyalty_programs')->get();
        foreach ($programs as $program) {
            DB::table('loyalty_program_tiers')->insert([
                'loyalty_program_id' => $program->id,
                'required_stamps' => $program->required_stamps,
                'reward_type' => $program->reward_type,
                'reward_value' => $program->reward_value,
                'reward_product_id' => $program->reward_product_id,
                'reward_description' => $program->reward_description,
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Add cycle_number to loyalty_cards
        Schema::table('loyalty_cards', function (Blueprint $table) {
            $table->unsignedInteger('cycle_number')->default(1)->after('total_rewards_redeemed');
        });

        // 4. Add tier reference and cycle_number to loyalty_rewards
        Schema::table('loyalty_rewards', function (Blueprint $table) {
            $table->foreignId('loyalty_program_tier_id')->nullable()->after('loyalty_program_id')
                ->constrained('loyalty_program_tiers')->nullOnDelete();
            $table->unsignedInteger('cycle_number')->default(1)->after('loyalty_program_tier_id');
        });

        // 5. Drop reward columns from loyalty_programs
        Schema::table('loyalty_programs', function (Blueprint $table) {
            $table->dropForeign(['reward_product_id']);
            $table->dropColumn(['reward_type', 'reward_value', 'reward_product_id', 'reward_description']);
        });
    }

    public function down(): void
    {
        // Re-add reward columns to loyalty_programs
        Schema::table('loyalty_programs', function (Blueprint $table) {
            $table->enum('reward_type', ['free_product', 'discount_percentage', 'discount_fixed'])
                ->default('free_product')->after('required_stamps');
            $table->decimal('reward_value', 10, 2)->nullable()->after('reward_type');
            $table->foreignId('reward_product_id')->nullable()->after('reward_value')
                ->constrained('services')->nullOnDelete();
            $table->string('reward_description')->nullable()->after('reward_product_id');
        });

        // Remove cycle_number and tier_id from loyalty_rewards
        Schema::table('loyalty_rewards', function (Blueprint $table) {
            $table->dropForeign(['loyalty_program_tier_id']);
            $table->dropColumn(['loyalty_program_tier_id', 'cycle_number']);
        });

        // Remove cycle_number from loyalty_cards
        Schema::table('loyalty_cards', function (Blueprint $table) {
            $table->dropColumn('cycle_number');
        });

        Schema::dropIfExists('loyalty_program_tiers');
    }
};
