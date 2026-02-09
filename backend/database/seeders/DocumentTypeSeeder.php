<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $documentTypes = [
            ['name' => 'SEC Registration', 'slug' => 'sec-registration', 'level' => 'organization', 'is_required' => true, 'sort_order' => 1],
            ['name' => 'DTI Certificate', 'slug' => 'dti-certificate', 'level' => 'organization', 'is_required' => true, 'sort_order' => 2],
            ['name' => 'BIR Certificate', 'slug' => 'bir-certificate', 'level' => 'both', 'is_required' => true, 'sort_order' => 3],
            ['name' => 'Business Permit', 'slug' => 'business-permit', 'level' => 'branch', 'is_required' => true, 'sort_order' => 4],
            ['name' => "Mayor's Permit", 'slug' => 'mayors-permit', 'level' => 'branch', 'is_required' => false, 'sort_order' => 5],
            ['name' => 'Barangay Clearance', 'slug' => 'barangay-clearance', 'level' => 'branch', 'is_required' => false, 'sort_order' => 6],
        ];

        foreach ($documentTypes as $documentType) {
            DocumentType::firstOrCreate(
                ['slug' => $documentType['slug']],
                $documentType
            );
        }
    }
}
