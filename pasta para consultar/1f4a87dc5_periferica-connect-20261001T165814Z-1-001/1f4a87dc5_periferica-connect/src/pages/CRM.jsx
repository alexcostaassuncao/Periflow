import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, BarChart2, Kanban } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import CRMKanban from '../components/crm/CRMKanban';
import CRMIndicadores from '../components/crm/CRMIndicadores';
import LeadFormModal from '../components/crm/LeadFormModal';

function getMeses() {
  const meses = [];
  const base = new Date(2025, 0, 1);
  for (let i = 0; i < 24; i++) {
    const d = addMonths(base, i);
    meses.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MM/yyyy') });
  }
  return meses;
}

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [mesAtual, setMesAtual] = useState(format(new Date(), 'yyyy-MM'));
  const [showNovo, setShowNovo] = useState(false);

  const meses = getMeses();

  useEffect(() => {
    loadLeads();
  }, [mesAtual]);

  const loadLeads = async () => {
    setLoading(true);
    const data = await localApp.entities.CRMLead.filter({ mes_referencia: mesAtual }, '-created_date');
    setLeads(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">CRM Comercial</h1>
          <p className="text-gray-400 mt-1 text-sm">Prospecção → Reunião → Contrato → Onboarding</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={mesAtual} onValueChange={setMesAtual}>
            <SelectTrigger className="w-36 bg-[#1a1a2e] border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNovo(true)} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />Nova ordem
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a2e] border border-white/10">
          <TabsTrigger value="kanban" className="data-[state=active]:bg-[#ff5000] data-[state=active]:text-white">
            <Kanban className="w-4 h-4 mr-2" />Fluxo / Kanban
          </TabsTrigger>
          <TabsTrigger value="indicadores" className="data-[state=active]:bg-[#ff5000] data-[state=active]:text-white">
            <BarChart2 className="w-4 h-4 mr-2" />Indicadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CRMKanban leads={leads} onRefresh={loadLeads} onNovo={() => setShowNovo(true)} />
          )}
        </TabsContent>

        <TabsContent value="indicadores" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CRMIndicadores leads={leads} mesReferencia={mesAtual} />
          )}
        </TabsContent>
      </Tabs>

      {showNovo && (
        <LeadFormModal open={showNovo} onClose={() => setShowNovo(false)} onSaved={loadLeads} />
      )}
    </div>
  );
}