import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  LineChart as ReLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const COLORS = ['#ff5000', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export const fmtMoney = (v) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function StatCard({ icon: Icon, label, value, color = 'text-[#ff5000]', sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-xl p-5"
    >
      <Icon className={`w-6 h-6 ${color} mb-3`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </motion.div>
  );
}

export function SimpleBarChart({ data, xKey, yKey, label = 'Total' }) {
  if (!data?.length) return <EmptyMsg />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
          <Bar dataKey={yKey} fill="#ff5000" radius={[4, 4, 0, 0]} name={label} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimplePieChart({ data, nameKey = 'name', valueKey = 'value' }) {
  if (!data?.length) return <EmptyMsg />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={85}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleLineChart({ data, xKey, yKey, label = 'Total' }) {
  if (!data?.length) return <EmptyMsg />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
          <Line type="monotone" dataKey={yKey} stroke="#ff5000" strokeWidth={2} dot={{ fill: '#ff5000' }} name={label} />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SectionCard({ title, children }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function DataTable({ columns, rows }) {
  if (!rows?.length) return <EmptyMsg />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#1a1a2e] text-gray-400">
          <tr>
            {columns.map(c => (
              <th key={c.key} className="text-left px-4 py-3 font-medium whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/3">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3 text-gray-300">
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyMsg({ msg = 'Nenhum dado encontrado' }) {
  return <div className="text-center py-12 text-gray-600">{msg}</div>;
}

// PDF Export utility
export async function exportPDF(title, period, contentId) {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');
  const element = document.getElementById(contentId);
  if (!element) return;

  const canvas = await html2canvas(element, { backgroundColor: '#12121a', scale: 1.5 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Header
  pdf.setFillColor(18, 18, 26);
  pdf.rect(0, 0, pageW, pageH, 'F');
  pdf.setFillColor(255, 80, 0);
  pdf.rect(0, 0, pageW, 18, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Periférica Marketing Agency', 10, 12);
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(title, pageW / 2, 12, { align: 'center' });
  pdf.text(`Período: ${period} | Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageW - 10, 12, { align: 'right' });

  // Content
  const imgH = (canvas.height * (pageW - 20)) / canvas.width;
  pdf.addImage(imgData, 'PNG', 10, 22, pageW - 20, Math.min(imgH, pageH - 35));

  // Footer
  pdf.setFillColor(255, 80, 0);
  pdf.rect(0, pageH - 8, pageW, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text('Periférica Marketing Agency — Relatório Confidencial', pageW / 2, pageH - 3, { align: 'center' });

  pdf.save(`${title.toLowerCase().replace(/\s/g, '_')}.pdf`);
}