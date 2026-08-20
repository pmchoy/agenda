<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('professional_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('weekday');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->index(['professional_id', 'weekday']);
        });

        DB::statement(<<<'SQL'
            ALTER TABLE professional_hours ADD CONSTRAINT chk_professional_hours_closed_or_open CHECK (
                (is_closed = 1 AND opens_at IS NULL AND closes_at IS NULL)
                OR
                (is_closed = 0 AND opens_at IS NOT NULL AND closes_at IS NOT NULL AND closes_at > opens_at)
            )
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professional_hours');
    }
};
