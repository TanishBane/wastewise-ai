import React from 'react';
import { Shield, Database, Lock, Eye, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { PageId } from '../components/Sidebar';

interface PrivacyPolicyViewProps {
  onNavigate: (page: PageId) => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16865D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      <PageHeader
        title="Privacy Policy & Data Handling"
        subtitle="Transparent operational summary of telemetry usage, local execution boundaries, and data processing practices for the WasteWise AI prototype."
        stageTag="Legal & Trust"
      />

      {/* Advisory Banner */}
      <div className="p-4 bg-[#FFF3D9] border border-[#E7A32D] rounded-xl text-xs text-[#92400E] flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-[#E7A32D] mt-0.5" />
        <div>
          <span className="font-bold block">Prototype Demonstration Notice</span>
          <p className="mt-0.5 leading-relaxed">
            WasteWise AI is currently deployed as an innovation prototype for <strong>ADAPPT 5.0 — AI in FoodTech</strong>. 
            This document outlines actual data handling in the current demonstration build. It does not constitute a formal commercial Data Processing Agreement (DPA) or guarantee third-party statutory certifications (such as GDPR or India’s DPDP Act) prior to production deployment.
          </p>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="space-y-5 text-xs text-[#17232E] leading-relaxed">
        {/* Section 1 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <Database className="w-4 h-4 text-[#16865D]" />
            <h2>1. Synthetic Demonstration Data Baseline</h2>
          </div>
          <p className="text-[#647386]">
            By default, all operational records, menu sales, attendance indices, and dish transactions presented in this application are synthetically generated for demonstration. The 365-day dataset (September 2025 – September 2026) models realistic cafeteria footfall, academic schedules, and weather patterns without containing real student, faculty, or staff records.
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <Lock className="w-4 h-4 text-[#087E8B]" />
            <h2>2. Operator-Uploaded CSV Data & Processing Boundary</h2>
          </div>
          <p className="text-[#647386]">
            When an authorized canteen operator uploads custom point-of-sale or prep logs via the Data & Model Governance module:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#647386]">
            <li>Processing occurs entirely within the local host environment (local Python FastAPI server and Vite frontend).</li>
            <li>No records are transmitted to external third-party cloud analytics platforms, LLM providers, or public tracking networks.</li>
            <li>Uploaded files are held in local runtime memory and the local project workspace for retraining the Random Forest regressor.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <Eye className="w-4 h-4 text-[#4263D8]" />
            <h2>3. Non-Collection of Personal Identifiable Information (PII)</h2>
          </div>
          <p className="text-[#647386]">
            The WasteWise AI schema is strictly restricted to aggregated operational food counts. The system neither requests, stores, nor inspects:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#647386]">
            <li>Customer names, email addresses, phone numbers, or campus roll numbers.</li>
            <li>Payment instrument details, credit card numbers, or bank accounts.</li>
            <li>Individual diner purchase histories, biometric identifiers, or dietary profiling.</li>
          </ul>
          <p className="text-[#647386]">
            Operational fields are strictly limited to: service date, menu dish name, portions sold, portions prepared, attendance factor (0.2–2.0), campus event flag (0/1), weather conditions, and unit costs.
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <CheckCircle2 className="w-4 h-4 text-[#7656D6]" />
            <h2>4. Data Retention, Local Storage & Reset Rights</h2>
          </div>
          <p className="text-[#647386]">
            Operators have full control over data residency during local deployment:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#647386]">
            <li><strong>Browser Storage:</strong> Session-only variables (such as intro video dismissal, active scenario preset, and UI density) are stored in browser <code className="font-mono bg-[#F0F3F8] px-1 py-0.5 rounded">sessionStorage</code> and <code className="font-mono bg-[#F0F3F8] px-1 py-0.5 rounded">localStorage</code>.</li>
            <li><strong>Factory Reset:</strong> Operators can at any time click &quot;Restore Demo Data&quot; in the Data & Model tab to overwrite custom uploaded telemetry and restore default demonstration weights.</li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <Shield className="w-4 h-4 text-[#16865D]" />
            <h2>5. Commercial Roadmap & Responsibilities</h2>
          </div>
          <p className="text-[#647386]">
            Before commercial enterprise deployment across university cafeterias or corporate dining halls, the operating organization must execute an institutional Data Processing Agreement, configure role-based access control (RBAC), and conduct formal security compliance reviews.
          </p>
        </div>
      </div>
    </div>
  );
};
