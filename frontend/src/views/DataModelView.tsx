import React, { useState, useEffect } from 'react';
import {
  Database,
  UploadCloud,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  Calendar,
  Table,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { fetchDataInfo, uploadDatasetCSV, resetDataset } from '../api';
import { DataInfoResponse } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { tokens } from '../tokens';

interface DataModelViewProps {
  onOpenLimitations?: () => void;
}

export const DataModelView: React.FC<DataModelViewProps> = ({ onOpenLimitations }) => {
  const [dataInfo, setDataInfo] = useState<DataInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [previewFilter, setPreviewFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDataInfo();
      setDataInfo(res);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to load dataset details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage(null);
      const res = await uploadDatasetCSV(file);
      setMessage({ text: res.message || 'CSV uploaded and model retrained successfully!', type: 'success' });
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'CSV validation failed', type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      setMessage(null);
      const res = await resetDataset();
      setMessage({ text: res.message, type: 'success' });
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to reset dataset', type: 'error' });
    } finally {
      setResetting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'date,menu_item,category,selling_price,cost_price,portions_sold,portions_prepared,day_of_week,attendance_index,campus_event,weather\n' +
      '2026-09-01,Chicken Biryani,Rice & Main,120,45,85,90,Tuesday,1.02,0,Sunny\n' +
      '2026-09-01,Paneer Butter Masala,Curry & Gravy,90,32,60,65,Tuesday,1.02,0,Sunny\n' +
      '2026-09-01,Veg Fried Rice,Rice & Main,60,20,50,55,Tuesday,1.02,0,Sunny\n' +
      '2026-09-01,Dal Tadka,Curry & Gravy,45,14,75,80,Tuesday,1.02,0,Sunny\n' +
      '2026-09-01,Samosa (Plate of 2),Snack & Quick Bite,30,10,110,120,Tuesday,1.02,0,Sunny\n' +
      '2026-09-01,Masala Dosa,Breakfast & Tiffin,50,16,68,70,Tuesday,1.02,0,Sunny\n' +
      '2026-09-01,Chole Bhature,Breakfast & Tiffin,70,24,52,55,Tuesday,1.02,0,Sunny\n' +
      '2026-09-01,Gulab Jamun,Dessert,35,11,40,45,Tuesday,1.02,0,Sunny\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'wastewise_canteen_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const schemaColumns = [
    { name: 'date', type: 'YYYY-MM-DD', req: 'Required', desc: 'Service date for operational recording' },
    { name: 'menu_item', type: 'String', req: 'Required', desc: 'Standardized canteen menu dish name' },
    { name: 'portions_sold', type: 'Integer (>= 0)', req: 'Required', desc: 'Actual count of portions sold to customers' },
    { name: 'portions_prepared', type: 'Integer (>= 0)', req: 'Required', desc: 'Total portions cooked or prepared initially' },
    { name: 'day_of_week', type: 'String', req: 'Optional', desc: 'Monday through Sunday (derived if omitted)' },
    { name: 'attendance_index', type: 'Float (0.2 - 2.0)', req: 'Recommended', desc: 'Campus/cafeteria attendance factor (1.0 = normal)' },
    { name: 'campus_event', type: '0 or 1', req: 'Recommended', desc: 'Binary indicator for festival, exam, or sports meet' },
    { name: 'weather', type: 'String', req: 'Recommended', desc: 'Sunny, Rain, Overcast, or Extreme Heat' },
    { name: 'selling_price', type: 'Float (> 0)', req: 'Optional', desc: 'Unit retail menu price (INR)' },
    { name: 'cost_price', type: 'Float (> 0)', req: 'Optional', desc: 'Raw ingredient cost per portion (INR)' },
  ];

  const filteredPreview = dataInfo?.preview?.filter((row) => {
    if (!previewFilter) return true;
    const term = previewFilter.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Data & Model Governance"
        subtitle="Manage historical operational logs, validate custom CSV uploads, and inspect dataset schema transparency."
        stageTag="Governance & Audit"
        onOpenLimitations={onOpenLimitations}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DFE5EC] bg-[#FFFFFF] text-[#17232E] hover:bg-[#F0F3F8] transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-[#16865D]" />
              <span>Download Schema CSV</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DFE5EC] bg-[#FFFFFF] text-[#17232E] hover:bg-[#F0F3F8] transition-colors shadow-xs disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 text-[#647386] ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Restoring...' : 'Restore Demo Data'}</span>
            </button>
          </div>
        }
      />

      {/* Provenance Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
          dataInfo?.is_synthetic
            ? 'bg-[#FFFFFF] border-[#DFE5EC]'
            : 'bg-[#E4F7ED] border-[#16865D] text-[#12523C]'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              dataInfo?.is_synthetic
                ? 'bg-[#FFF3D9] text-[#92400E] border border-[#E7A32D]'
                : 'bg-[#16865D] text-white shadow-xs'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm font-bold text-[#17232E]">
                {dataInfo?.is_synthetic
                  ? 'Demonstration Environment · 365-Day Synthetic Dataset'
                  : 'Live Custom Operator Telemetry Ingested'}
              </h2>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  dataInfo?.is_synthetic
                    ? 'bg-[#FFF3D9] text-[#92400E] border border-[#E7A32D]'
                    : 'bg-[#E4F7ED] text-[#12523C] border border-[#16865D]'
                }`}
              >
                {dataInfo?.is_synthetic ? 'Synthetic Data' : 'Custom Upload'}
              </span>
            </div>
            <p className="text-xs text-[#647386] mt-1 leading-relaxed">
              {dataInfo?.is_synthetic
                ? 'Synthesized with realistic college canteen seasonal patterns, exam dips, campus fests, and weather shocks across 8 menu items.'
                : 'Custom operational records ingested. Random Forest regressor is actively trained on your service logs.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-[#17232E] shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F3F8] border border-[#DFE5EC] rounded-lg">
            <Calendar className="w-4 h-4 text-[#087E8B]" />
            <span>
              {dataInfo?.date_min || '—'} → {dataInfo?.date_max || '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F3F8] border border-[#DFE5EC] rounded-lg">
            <Table className="w-4 h-4 text-[#087E8B]" />
            <span>{dataInfo?.total_records?.toLocaleString() || 0} Records</span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 shadow-xs ${
            message.type === 'success'
              ? 'bg-[#E4F7ED] border-[#16865D] text-[#12523C]'
              : 'bg-[#FDE9E7] border-[#E96B63] text-[#BF3F45]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#16865D] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[#BF3F45] shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Ingestion & Schema Specification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CSV Upload Zone */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-xl border border-[#DFE5EC] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F0F3F8]">
            <UploadCloud className="w-4 h-4 text-[#087E8B]" />
            <h2 className="text-sm font-bold text-[#17232E]">Upload Operator CSV</h2>
          </div>
          <p className="text-xs text-[#647386] leading-relaxed">
            Ingest daily point-of-sale and kitchen prep logs. The automated backend validates schemas, derives temporal lag features, and retrains the Random Forest model.
          </p>

          <label
            htmlFor="csv-upload"
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              uploading
                ? 'border-[#16865D] bg-[#E4F7ED]/50 cursor-not-allowed'
                : 'border-[#DFE5EC] hover:border-[#16865D] hover:bg-[#F5F7FA]'
            }`}
          >
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileSpreadsheet
              className={`w-10 h-10 mb-2 ${
                uploading ? 'text-[#16865D] animate-bounce' : 'text-[#647386]'
              }`}
            />
            <p className="text-xs font-bold text-[#17232E]">
              {uploading ? 'Validating & Retraining...' : 'Click to select or drag .csv file'}
            </p>
            <p className="text-xs text-[#647386] mt-1">Supports standard CSV format with UTF-8 encoding</p>
          </label>

          <div className="p-3.5 bg-[#F0F3F8] rounded-xl border border-[#DFE5EC] text-xs text-[#17232E] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#17232E]">
              <Info className="w-4 h-4 text-[#087E8B]" />
              <span>Model Ingestion Safeguards</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-xs text-[#647386]">
              <li>Minimum 14 historical service days required for chronological split validation.</li>
              <li>Missing attendance indices default to 1.0 (neutral baseline).</li>
              <li>Non-standard dishes map to generalized category priors.</li>
            </ul>
          </div>
        </div>

        {/* Schema Requirement Table */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-xl border border-[#DFE5EC] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F3F8]">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#087E8B]" />
              <h2 className="text-sm font-bold text-[#17232E]">Expected Dataset Schema</h2>
            </div>
            <span className="text-xs text-[#647386] font-semibold">8 Core Columns + 2 Optional</span>
          </div>

          <div className="overflow-x-auto max-h-[340px] border border-[#DFE5EC] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F3F8] text-[#17232E] font-bold sticky top-0 border-b border-[#DFE5EC]">
                <tr>
                  <th className="py-2.5 px-3">Column Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE5EC] text-[#17232E]">
                {schemaColumns.map((col, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F7FA] transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-xs text-[#087E8B]">{col.name}</td>
                    <td className="py-2 px-3 text-[#647386] font-mono text-xs">{col.type}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-sm ${
                          col.req === 'Required'
                            ? 'bg-[#FDE9E7] text-[#BF3F45]'
                            : col.req === 'Recommended'
                            ? 'bg-[#FFF3D9] text-[#92400E]'
                            : 'bg-[#F0F3F8] text-[#647386]'
                        }`}
                      >
                        {col.req}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#17232E] text-xs">{col.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dataset Preview Explorer */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#DFE5EC] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F3F8]">
          <div>
            <h2 className="text-base font-bold text-[#17232E]">Active Dataset Explorer</h2>
            <p className="text-xs text-[#647386]">Recent records from active operational training set</p>
          </div>
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-[#647386] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dish, date, weather..."
              value={previewFilter}
              onChange={(e) => setPreviewFilter(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#DFE5EC] bg-[#F5F7FA] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#16865D] text-[#17232E] placeholder:text-[#647386]"
            />
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={5} />
        ) : filteredPreview && filteredPreview.length > 0 ? (
          <div className="overflow-x-auto border border-[#DFE5EC] rounded-lg max-h-[400px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F3F8] text-[#17232E] font-bold border-b border-[#DFE5EC] sticky top-0">
                <tr>
                  {dataInfo?.columns?.map((col, idx) => (
                    <th key={idx} className="py-2.5 px-3 whitespace-nowrap font-mono text-xs">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE5EC] font-mono text-xs text-[#17232E]">
                {filteredPreview.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#F5F7FA] transition-colors">
                    {dataInfo?.columns?.map((col, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                        {String(row[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#647386]">No records match your filter criteria.</div>
        )}
      </div>
    </div>
  );
};
