import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Demo data for when Supabase is not configured
let demoModels = [
  { id: '1', model_name: 'Fortuner', base_suffix: 'GD6', variant: 'Legender', is_active: true, created_at: new Date().toISOString() },
  { id: '2', model_name: 'Innova Crysta', base_suffix: 'GD', variant: 'ZX', is_active: true, created_at: new Date().toISOString() },
  { id: '3', model_name: 'Camry', base_suffix: 'AXH', variant: 'Hybrid', is_active: true, created_at: new Date().toISOString() },
  { id: '4', model_name: 'Glanza', base_suffix: 'K12', variant: 'S', is_active: true, created_at: new Date().toISOString() },
];

export const vehicleModelService = {
  async getAll() {
    if (!isSupabaseConfigured) {
      return { data: demoModels, error: null };
    }
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('*')
      .eq('is_active', true)
      .order('model_name', { ascending: true });
    return { data, error };
  },

  async create(model) {
    if (!isSupabaseConfigured) {
      const newModel = { ...model, id: Date.now().toString(), is_active: true, created_at: new Date().toISOString() };
      demoModels = [...demoModels, newModel];
      return { data: newModel, error: null };
    }
    const { data, error } = await supabase
      .from('vehicle_models')
      .insert([{ ...model, is_active: true }])
      .select()
      .single();
    return { data, error };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured) {
      demoModels = demoModels.map(m => m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m);
      return { data: demoModels.find(m => m.id === id), error: null };
    }
    const { data, error } = await supabase
      .from('vehicle_models')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured) {
      demoModels = demoModels.filter(m => m.id !== id);
      return { error: null };
    }
    const { error } = await supabase
      .from('vehicle_models')
      .update({ is_active: false })
      .eq('id', id);
    return { error };
  },
};
