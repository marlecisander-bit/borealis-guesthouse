'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewRoomTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 2,
    beds: 1,
    size_sqm: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting room type:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/admin/room-types');
    } catch (error) {
      console.error('Error creating room type:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/room-types"
          className="text-slate-600 hover:text-slate-900 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Room Types
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Create Room Type</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-slate-200 p-6 space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Room Type Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., Standard Room, Deluxe Suite"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe this room type..."
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Max Capacity *
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Beds *
            </label>
            <input
              type="number"
              value={formData.beds}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  beds: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Size (m²)
            </label>
            <input
              type="number"
              value={formData.size_sqm}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  size_sqm: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating...' : 'Create Room Type'}
          </button>
          <Link
            href="/admin/room-types"
            className="px-6 py-2 border border-slate-300 text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
