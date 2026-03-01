import api from '@/lib/axios';
import { ApiResponse, GeoRegion, GeoProvince, GeoCity, GeoBarangay } from '@/types/api';

export const geographicService = {
  getRegions: async (): Promise<ApiResponse<GeoRegion[]>> => {
    const response = await api.get<ApiResponse<GeoRegion[]>>('/geographic/regions');
    return response.data;
  },

  getProvinces: async (regionId: number): Promise<ApiResponse<GeoProvince[]>> => {
    const response = await api.get<ApiResponse<GeoProvince[]>>(`/geographic/regions/${regionId}/provinces`);
    return response.data;
  },

  getCities: async (provinceId: number): Promise<ApiResponse<GeoCity[]>> => {
    const response = await api.get<ApiResponse<GeoCity[]>>(`/geographic/provinces/${provinceId}/cities`);
    return response.data;
  },

  getBarangays: async (cityId: number): Promise<ApiResponse<GeoBarangay[]>> => {
    const response = await api.get<ApiResponse<GeoBarangay[]>>(`/geographic/cities/${cityId}/barangays`);
    return response.data;
  },
};
