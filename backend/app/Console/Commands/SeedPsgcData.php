<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\Province;
use App\Models\Region;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class SeedPsgcData extends Command
{
    protected $signature = 'psgc:seed {--fresh : Truncate tables before seeding}';

    protected $description = 'Seed Philippine geographic data from the PSGC API';

    private string $baseUrl = 'https://psgc.gitlab.io/api';

    private const NCR_CODE = '130000000';

    public function handle(): int
    {
        if ($this->option('fresh')) {
            $this->info('Truncating tables...');
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('barangays')->truncate();
            DB::table('cities')->truncate();
            DB::table('provinces')->truncate();
            DB::table('regions')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        DB::disableQueryLog();

        $this->seedRegions();
        $this->seedProvincesAndBelow();

        $this->newLine();
        $this->info('PSGC seeding complete!');
        $this->table(
            ['Table', 'Count'],
            [
                ['Regions', Region::count()],
                ['Provinces', Province::count()],
                ['Cities', City::count()],
                ['Barangays', \App\Models\Barangay::count()],
            ]
        );

        return self::SUCCESS;
    }

    private function seedRegions(): void
    {
        $this->info('Fetching regions...');

        $regions = $this->fetchApi('/regions/');

        $rows = collect($regions)->map(fn ($r) => [
            'code' => $r['code'],
            'name' => $r['name'],
            'region_name' => $r['regionName'] ?? null,
            'island_group_code' => $this->nullIfFalsy($r['islandGroupCode'] ?? null),
            'psgc_10_digit_code' => $this->nullIfEmpty($r['psgc10DigitCode'] ?? null),
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        Region::upsert($rows, ['code'], ['name', 'region_name', 'island_group_code', 'psgc_10_digit_code', 'updated_at']);

        $this->info("  Upserted " . count($rows) . " regions.");
    }

    private function seedProvincesAndBelow(): void
    {
        $regions = Region::orderBy('code')->get();
        $bar = $this->output->createProgressBar($regions->count());
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% — %message%');
        $bar->start();

        foreach ($regions as $region) {
            $bar->setMessage($region->name);

            if ($region->code === self::NCR_CODE) {
                $this->seedNcrDistricts($region);
            } else {
                $this->seedProvincesForRegion($region);
            }

            $bar->advance();
        }

        $bar->finish();
    }

    private function seedNcrDistricts(Region $region): void
    {
        $districts = $this->fetchApi("/regions/{$region->code}/districts/");

        $rows = collect($districts)->map(fn ($d) => [
            'region_id' => $region->id,
            'code' => $d['code'],
            'name' => $d['name'],
            'island_group_code' => $this->nullIfFalsy($d['islandGroupCode'] ?? null),
            'psgc_10_digit_code' => $this->nullIfEmpty($d['psgc10DigitCode'] ?? null),
            'is_district' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        Province::upsert($rows, ['code'], ['region_id', 'name', 'island_group_code', 'psgc_10_digit_code', 'is_district', 'updated_at']);

        // Fetch cities for each district
        foreach ($districts as $district) {
            $province = Province::where('code', $district['code'])->first();
            if ($province) {
                $this->seedCitiesForProvince($province, $region, "/districts/{$district['code']}/cities-municipalities/");
            }
        }
    }

    private function seedProvincesForRegion(Region $region): void
    {
        $provinces = $this->fetchApi("/regions/{$region->code}/provinces/");

        $rows = collect($provinces)->map(fn ($p) => [
            'region_id' => $region->id,
            'code' => $p['code'],
            'name' => $p['name'],
            'island_group_code' => $this->nullIfFalsy($p['islandGroupCode'] ?? null),
            'psgc_10_digit_code' => $this->nullIfEmpty($p['psgc10DigitCode'] ?? null),
            'is_district' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        Province::upsert($rows, ['code'], ['region_id', 'name', 'island_group_code', 'psgc_10_digit_code', 'is_district', 'updated_at']);

        // Fetch cities for each province
        foreach ($provinces as $prov) {
            $province = Province::where('code', $prov['code'])->first();
            if ($province) {
                $this->seedCitiesForProvince($province, $region, "/provinces/{$prov['code']}/cities-municipalities/");
            }
        }
    }

    private function seedCitiesForProvince(Province $province, Region $region, string $endpoint): void
    {
        $cities = $this->fetchApi($endpoint);

        if (empty($cities)) {
            return;
        }

        $rows = collect($cities)->map(fn ($c) => [
            'province_id' => $province->id,
            'region_id' => $region->id,
            'code' => $c['code'],
            'name' => $c['name'],
            'old_name' => $this->nullIfEmpty($c['oldName'] ?? null),
            'is_capital' => $c['isCapital'] ?? false,
            'is_city' => $c['isCity'] ?? false,
            'is_municipality' => $c['isMunicipality'] ?? false,
            'island_group_code' => $this->nullIfFalsy($c['islandGroupCode'] ?? null),
            'psgc_10_digit_code' => $this->nullIfEmpty($c['psgc10DigitCode'] ?? null),
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        City::upsert($rows, ['code'], [
            'province_id', 'region_id', 'name', 'old_name',
            'is_capital', 'is_city', 'is_municipality',
            'island_group_code', 'psgc_10_digit_code', 'updated_at',
        ]);

        // Fetch barangays for each city
        foreach ($cities as $city) {
            $cityModel = City::where('code', $city['code'])->first();
            if ($cityModel) {
                $this->seedBarangaysForCity($cityModel, $province, $region);
            }
        }
    }

    private function seedBarangaysForCity(City $city, Province $province, Region $region): void
    {
        $barangays = $this->fetchApi("/cities-municipalities/{$city->code}/barangays/");

        if (empty($barangays)) {
            return;
        }

        $rows = collect($barangays)->map(fn ($b) => [
            'city_id' => $city->id,
            'province_id' => $province->id,
            'region_id' => $region->id,
            'code' => $b['code'],
            'name' => $b['name'],
            'old_name' => $this->nullIfEmpty($b['oldName'] ?? null),
            'island_group_code' => $this->nullIfFalsy($b['islandGroupCode'] ?? null),
            'psgc_10_digit_code' => $this->nullIfEmpty($b['psgc10DigitCode'] ?? null),
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        // Batch upsert in chunks to avoid memory issues with large barangay sets
        foreach (array_chunk($rows, 500) as $chunk) {
            \App\Models\Barangay::upsert($chunk, ['code'], [
                'city_id', 'province_id', 'region_id', 'name', 'old_name',
                'island_group_code', 'psgc_10_digit_code', 'updated_at',
            ]);
        }
    }

    private function fetchApi(string $path): array
    {
        $response = Http::timeout(30)
            ->retry(3, 1000)
            ->get("{$this->baseUrl}{$path}");

        $response->throw();

        return $response->json();
    }

    /**
     * Convert falsy values (false, empty string) to null.
     * The PSGC API returns `false` for some code fields instead of null.
     */
    private function nullIfFalsy(mixed $value): ?string
    {
        if ($value === false || $value === '' || $value === null) {
            return null;
        }

        return (string) $value;
    }

    private function nullIfEmpty(mixed $value): ?string
    {
        if ($value === '' || $value === null || $value === false) {
            return null;
        }

        return (string) $value;
    }
}
