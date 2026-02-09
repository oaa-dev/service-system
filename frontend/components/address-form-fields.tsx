'use client';

import { useEffect } from 'react';
import { Control, useWatch, useFormContext } from 'react-hook-form';
import { useRegions, useProvinces, useCities, useBarangays } from '@/hooks/useGeographic';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface AddressFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  namePrefix?: string;
  disabled?: boolean;
}

export function AddressFormFields({
  control,
  namePrefix = 'address',
  disabled = false,
}: AddressFormFieldsProps) {
  const { setValue } = useFormContext();

  const regionId = useWatch({ control, name: `${namePrefix}.region_id` });
  const provinceId = useWatch({ control, name: `${namePrefix}.province_id` });
  const cityId = useWatch({ control, name: `${namePrefix}.city_id` });
  const barangayId = useWatch({ control, name: `${namePrefix}.barangay_id` });

  const { data: regionsData, isLoading: regionsLoading } = useRegions();
  const { data: provincesData, isLoading: provincesLoading } = useProvinces(regionId);
  const { data: citiesData, isLoading: citiesLoading } = useCities(provinceId);
  const { data: barangaysData, isLoading: barangaysLoading } = useBarangays(cityId);

  const regionOptions: ComboboxOption[] = (regionsData?.data || []).map((r) => ({ id: r.id, label: r.name }));
  const provinceOptions: ComboboxOption[] = (provincesData?.data || []).map((p) => ({ id: p.id, label: p.name }));
  const cityOptions: ComboboxOption[] = (citiesData?.data || []).map((c) => ({ id: c.id, label: c.name }));
  const barangayOptions: ComboboxOption[] = (barangaysData?.data || []).map((b) => ({ id: b.id, label: b.name }));

  // Cascade: region change clears province, city, barangay
  useEffect(() => {
    // Only clear if province doesn't belong to the newly selected region
    // On initial load, we skip clearing
    if (regionId === undefined) return;
    const currentProvince = provincesData?.data?.find((p) => p.id === provinceId);
    if (provinceId && !currentProvince) {
      setValue(`${namePrefix}.province_id`, null);
      setValue(`${namePrefix}.city_id`, null);
      setValue(`${namePrefix}.barangay_id`, null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId, provincesData]);

  // Cascade: province change clears city, barangay
  useEffect(() => {
    if (provinceId === undefined) return;
    const currentCity = citiesData?.data?.find((c) => c.id === cityId);
    if (cityId && !currentCity) {
      setValue(`${namePrefix}.city_id`, null);
      setValue(`${namePrefix}.barangay_id`, null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId, citiesData]);

  // Cascade: city change clears barangay
  useEffect(() => {
    if (cityId === undefined) return;
    const currentBarangay = barangaysData?.data?.find((b) => b.id === barangayId);
    if (barangayId && !currentBarangay) {
      setValue(`${namePrefix}.barangay_id`, null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, barangaysData]);

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${namePrefix}.street`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street</FormLabel>
            <FormControl>
              <Input disabled={disabled} {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`${namePrefix}.region_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    if (val !== field.value) {
                      setValue(`${namePrefix}.province_id`, null);
                      setValue(`${namePrefix}.city_id`, null);
                      setValue(`${namePrefix}.barangay_id`, null);
                    }
                  }}
                  options={regionOptions}
                  placeholder="Select region..."
                  searchPlaceholder="Search region..."
                  disabled={disabled}
                  isLoading={regionsLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${namePrefix}.province_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    if (val !== field.value) {
                      setValue(`${namePrefix}.city_id`, null);
                      setValue(`${namePrefix}.barangay_id`, null);
                    }
                  }}
                  options={provinceOptions}
                  placeholder="Select province..."
                  searchPlaceholder="Search province..."
                  disabled={disabled || !regionId}
                  isLoading={provincesLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`${namePrefix}.city_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>City / Municipality</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    if (val !== field.value) {
                      setValue(`${namePrefix}.barangay_id`, null);
                    }
                  }}
                  options={cityOptions}
                  placeholder="Select city..."
                  searchPlaceholder="Search city..."
                  disabled={disabled || !provinceId}
                  isLoading={citiesLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${namePrefix}.barangay_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barangay</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={barangayOptions}
                  placeholder="Select barangay..."
                  searchPlaceholder="Search barangay..."
                  disabled={disabled || !cityId}
                  isLoading={barangaysLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="w-1/2">
        <FormField
          control={control}
          name={`${namePrefix}.postal_code`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input disabled={disabled} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
