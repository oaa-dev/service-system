<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerTag;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoCustomerSeeder extends Seeder
{
    public function run(): void
    {
        $tags = CustomerTag::where('is_active', true)->pluck('id')->toArray();

        // 20 customers with realistic Filipino names
        $customers = [
            ['name' => 'Maria Santos', 'email' => 'maria.santos@example.com', 'type' => 'individual'],
            ['name' => 'Juan Dela Cruz', 'email' => 'juan.delacruz@example.com', 'type' => 'individual'],
            ['name' => 'Ana Reyes', 'email' => 'ana.reyes@example.com', 'type' => 'individual'],
            ['name' => 'Carlos Garcia', 'email' => 'carlos.garcia@example.com', 'type' => 'individual'],
            ['name' => 'Sofia Mendoza', 'email' => 'sofia.mendoza@example.com', 'type' => 'individual'],
            ['name' => 'Miguel Torres', 'email' => 'miguel.torres@example.com', 'type' => 'individual'],
            ['name' => 'Isabella Cruz', 'email' => 'isabella.cruz@example.com', 'type' => 'individual'],
            ['name' => 'Rafael Bautista', 'email' => 'rafael.bautista@example.com', 'type' => 'individual'],
            ['name' => 'Patricia Villanueva', 'email' => 'patricia.villanueva@example.com', 'type' => 'individual'],
            ['name' => 'Andres Ramos', 'email' => 'andres.ramos@example.com', 'type' => 'individual'],
            ['name' => 'Gabriela Lopez', 'email' => 'gabriela.lopez@example.com', 'type' => 'individual'],
            ['name' => 'Emmanuel Aquino', 'email' => 'emmanuel.aquino@example.com', 'type' => 'individual'],
            ['name' => 'Camille Fernandez', 'email' => 'camille.fernandez@example.com', 'type' => 'individual'],
            ['name' => 'Roberto Navarro', 'email' => 'roberto.navarro@example.com', 'type' => 'individual'],
            // Corporate customers
            ['name' => 'Liza Ocampo', 'email' => 'liza.ocampo@acmecorp.com', 'type' => 'corporate', 'company' => 'ACME Corporation'],
            ['name' => 'Marco Dizon', 'email' => 'marco.dizon@techph.com', 'type' => 'corporate', 'company' => 'TechPH Solutions'],
            ['name' => 'Angela Pascual', 'email' => 'angela.pascual@stargroup.com', 'type' => 'corporate', 'company' => 'Star Group Holdings'],
            ['name' => 'Daniel Manalo', 'email' => 'daniel.manalo@greenleaf.com', 'type' => 'corporate', 'company' => 'Green Leaf Enterprises'],
            // Suspended customers (for variety)
            ['name' => 'Rico Salazar', 'email' => 'rico.salazar@example.com', 'type' => 'individual', 'status' => 'suspended'],
            ['name' => 'Joy Dimaculangan', 'email' => 'joy.dimaculangan@example.com', 'type' => 'individual', 'status' => 'suspended'],
        ];

        foreach ($customers as $data) {
            $user = User::factory()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'email_verified_at' => now(),
            ]);
            $user->assignRole('customer');

            $customerAttrs = [
                'user_id' => $user->id,
                'customer_type' => $data['type'],
                'status' => $data['status'] ?? 'active',
                'loyalty_points' => fake()->numberBetween(0, 500),
                'customer_tier' => fake()->randomElement(['regular', 'silver', 'gold']),
                'communication_preference' => fake()->randomElement(['sms', 'email', 'both']),
            ];

            if ($data['type'] === 'corporate') {
                $customerAttrs['company_name'] = $data['company'];
            }

            $customer = Customer::create($customerAttrs);

            // Attach 1-3 random tags
            if (!empty($tags)) {
                $tagCount = rand(1, min(3, count($tags)));
                $selectedTags = collect($tags)->random($tagCount)->toArray();
                $customer->tags()->sync($selectedTags);
            }
        }

        $this->command->info('Created ' . count($customers) . ' demo customers.');
    }
}
