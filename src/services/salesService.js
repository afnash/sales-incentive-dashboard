import { supabase, isSupabaseConfigured } from '../lib/supabase';

let demoSales = [];

export const salesService = {
  async getByMonth(month) {
    if (!isSupabaseConfigured) {
      return { data: demoSales.filter(s => s.month === month), error: null };
    }
    const { data, error } = await supabase
      .from('monthly_sales')
      .select('*, vehicle_models(*)')
      .eq('month', month)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  async upsert(month, vehicleModelId, quantitySold, officerName = 'Sales Officer') {
    if (!isSupabaseConfigured) {
      const existing = demoSales.findIndex(
        s => s.month === month && s.vehicle_model_id === vehicleModelId
      );
      if (existing >= 0) {
        demoSales[existing] = { ...demoSales[existing], quantity_sold: quantitySold };
      } else {
        demoSales.push({
          id: Date.now().toString(),
          month,
          vehicle_model_id: vehicleModelId,
          quantity_sold: quantitySold,
          officer_name: officerName,
          created_at: new Date().toISOString(),
        });
      }
      return { error: null };
    }
    const { error } = await supabase
      .from('monthly_sales')
      .upsert(
        {
          month,
          vehicle_model_id: vehicleModelId,
          quantity_sold: quantitySold,
          officer_name: officerName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'month,vehicle_model_id,officer_name' }
      );
    return { error };
  },
};
