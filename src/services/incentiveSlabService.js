import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Demo data for when Supabase is not configured
let demoSlabs = [
  { id: '1', min_quantity: 1, max_quantity: 3, incentive_per_car: 1000, label: '1-3 cars', is_active: true, created_at: new Date().toISOString() },
  { id: '2', min_quantity: 4, max_quantity: 7, incentive_per_car: 2000, label: '4-7 cars', is_active: true, created_at: new Date().toISOString() },
  { id: '3', min_quantity: 8, max_quantity: null, incentive_per_car: 3500, label: '8+ cars', is_active: true, created_at: new Date().toISOString() },
];

export const incentiveSlabService = {
  async getAll() {
    if (!isSupabaseConfigured) {
      return { data: demoSlabs, error: null };
    }
    const { data, error } = await supabase
      .from('incentive_slabs')
      .select('*')
      .eq('is_active', true)
      .order('min_quantity', { ascending: true });
    return { data, error };
  },

  async create(slab) {
    if (!isSupabaseConfigured) {
      const newSlab = {
        ...slab,
        id: Date.now().toString(),
        is_active: true,
        created_at: new Date().toISOString(),
        label: slab.max_quantity ? `${slab.min_quantity}-${slab.max_quantity} cars` : `${slab.min_quantity}+ cars`,
      };
      demoSlabs = [...demoSlabs, newSlab];
      return { data: newSlab, error: null };
    }
    const label = slab.max_quantity
      ? `${slab.min_quantity}-${slab.max_quantity} cars`
      : `${slab.min_quantity}+ cars`;
    const { data, error } = await supabase
      .from('incentive_slabs')
      .insert([{ ...slab, is_active: true, label }])
      .select()
      .single();
    return { data, error };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured) {
      const label = updates.max_quantity
        ? `${updates.min_quantity}-${updates.max_quantity} cars`
        : `${updates.min_quantity}+ cars`;
      demoSlabs = demoSlabs.map(s =>
        s.id === id ? { ...s, ...updates, label, updated_at: new Date().toISOString() } : s
      );
      return { data: demoSlabs.find(s => s.id === id), error: null };
    }
    const label = updates.max_quantity
      ? `${updates.min_quantity}-${updates.max_quantity} cars`
      : `${updates.min_quantity}+ cars`;
    const { data, error } = await supabase
      .from('incentive_slabs')
      .update({ ...updates, label, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured) {
      demoSlabs = demoSlabs.filter(s => s.id !== id);
      return { error: null };
    }
    const { error } = await supabase
      .from('incentive_slabs')
      .update({ is_active: false })
      .eq('id', id);
    return { error };
  },
};
