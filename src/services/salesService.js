import { supabase, isSupabaseConfigured } from '../lib/supabase';

let demoSales = [
  { id: 'd1', month: '2026-05', vehicle_model_id: '1', quantity_sold: 4, officer_name: 'Sales Officer', created_at: new Date().toISOString() },
  { id: 'd2', month: '2026-05', vehicle_model_id: '2', quantity_sold: 2, officer_name: 'Sales Officer', created_at: new Date().toISOString() },
  { id: 'd3', month: '2026-05', vehicle_model_id: '3', quantity_sold: 1, officer_name: 'Sales Officer', created_at: new Date().toISOString() },
  { id: 'd4', month: '2026-05', vehicle_model_id: '4', quantity_sold: 3, officer_name: 'Sales Officer', created_at: new Date().toISOString() },
  
  { id: 'd5', month: '2026-06', vehicle_model_id: '1', quantity_sold: 2, officer_name: 'Sales Officer', created_at: new Date().toISOString() },
  { id: 'd6', month: '2026-06', vehicle_model_id: '2', quantity_sold: 1, officer_name: 'Sales Officer', created_at: new Date().toISOString() },
  { id: 'd7', month: '2026-06', vehicle_model_id: '3', quantity_sold: 1, officer_name: 'Sales Officer', created_at: new Date().toISOString() },
  { id: 'd8', month: '2026-06', vehicle_model_id: '4', quantity_sold: 0, officer_name: 'Sales Officer', created_at: new Date().toISOString() },
];

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
