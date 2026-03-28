import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminPropertiesList() {
  const supabase = createClient();
  
  const { data: properties } = await supabase
    .from('pm_properties')
    .select(`
      id,
      name,
      slug,
      city,
      state_code,
      property_type,
      pm_regions (name)
    `)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Properties</h1>
          <p className="text-sm text-slate-500 font-medium">Manage properties.</p>
        </div>
        <Link 
          href="/admin/properties/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
        >
          + Add New Property
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Taxonomy</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties?.map((property: any) => (
              <tr key={property.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-5">
                  <span className="font-bold text-slate-900 block">{property.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono lowercase">{property.slug}</span>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                    property.property_type === 'campground' 
                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {property.property_type === 'campground' ? 'Campground' : 'MHC'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tight">
                    {property.pm_regions?.name || 'Unassigned'}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                  {property.city}, {property.state_code}
                </td>
                <td className="px-6 py-5 text-right">
                  <Link 
                    href={`/admin/properties/${property.id}`} 
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-widest"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}