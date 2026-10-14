import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { localApp } from '@/api/localClient';
import { format } from 'date-fns';
import { Save, Printer, FileText } from 'lucide-react';

const MODELOS = [
  { value: 'social_media', label: 'Contrato 1 — Social Media' },
  { value: 'trafego_pago', label: 'Contrato 2 — Tráfego Pago' },
  { value: 'pacote_completo', label: 'Contrato 3 — Pacote Completo' },
];

const STATUS_ASSINATURA = [
  { value: 'aguardando_assinatura', label: 'Aguardando assinatura' },
  { value: 'contrato_assinado', label: 'Contrato assinado' },
];

const fmt = (v) => v ? new Date(v + 'T12:00:00').toLocaleDateString('pt-BR') : '__/__/________';
const fmtMoney = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// ─── TEMPLATE 1: Social Media / Design Gráfico ─────────────────────────────
function templateSocialMedia(d) {
  return `
    <h1 style="text-align:center;text-transform:uppercase;font-size:18px;letter-spacing:2px;margin-bottom:6px;">Contrato de Prestação de Serviços</h1>
    <p style="text-align:center;font-size:13px;color:#555;margin-bottom:30px;">Social Media & Design Gráfico</p>

    <p style="font-size:13px;text-align:justify;margin-bottom:24px;">
      Pelo presente instrumento particular, de um lado:
    </p>

    <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:16px;margin-bottom:16px;">
      <p style="font-weight:bold;font-size:13px;margin:0 0 10px 0;color:#ff5000;text-transform:uppercase;">CONTRATANTE</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="width:160px;color:#666;padding:3px 0;"><strong>Nome/Razão Social:</strong></td><td>${d.razao_social || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>CPF/CNPJ:</strong></td><td>${d.cpf_cnpj || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Responsável:</strong></td><td>${d.responsavel || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Telefone:</strong></td><td>${d.telefone || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>E-mail:</strong></td><td>${d.email || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Endereço:</strong></td><td>${d.endereco || '_______________________'}</td></tr>
      </table>
    </div>

    <p style="font-size:13px;text-align:center;margin:10px 0;">E de outro lado:</p>

    <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:16px;margin-bottom:24px;">
      <p style="font-weight:bold;font-size:13px;margin:0 0 10px 0;color:#ff5000;text-transform:uppercase;">CONTRATADA</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="width:160px;color:#666;padding:3px 0;"><strong>Empresa:</strong></td><td>Periférica Agência de Publicidade Ltda - ME</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>CNPJ:</strong></td><td>13.883.869/0003-35</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Telefone:</strong></td><td>(XX) XXXXX-XXXX</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>E-mail:</strong></td><td>contato@periferica.com.br</td></tr>
      </table>
    </div>

    <p style="font-size:13px;text-align:justify;margin-bottom:20px;">As partes acima identificadas resolvem firmar o presente contrato de prestação de serviços.</p>

    <h2 class="clausula">CLÁUSULA 1 — OBJETO</h2>
    <p class="texto">O presente contrato tem como objeto a prestação de serviços de social media, design gráfico, criação de artes, materiais digitais, materiais impressos, identidade visual e gerenciamento de redes sociais acordados entre as partes.</p>

    <h2 class="clausula">CLÁUSULA 2 — SERVIÇOS CONTRATADOS</h2>
    <p class="texto">A CONTRATADA realizará os seguintes serviços conforme pacote acordado:</p>
    <ul class="lista">
      <li>Criação e gestão de conteúdo para redes sociais</li>
      <li>Design gráfico de posts, stories e materiais digitais</li>
      <li>Planejamento de conteúdo mensal</li>
      <li>Relatórios periódicos de desempenho</li>
      <li>Suporte e atendimento ao cliente</li>
    </ul>

    <h2 class="clausula">CLÁUSULA 3 — PRAZO</h2>
    <p class="texto">O contrato terá vigência a partir de <strong>${fmt(d.data_entrada)}</strong> até <strong>${fmt(d.data_encerramento) || 'indeterminado'}</strong>, podendo ser renovado mediante acordo entre as partes.</p>

    <h2 class="clausula">CLÁUSULA 4 — VALORES E PAGAMENTO</h2>
    <p class="texto">O valor mensal da prestação de serviço é de <strong style="color:#ff5000;">${fmtMoney(d.valor_mensal)}</strong>.</p>
    ${d.valor_entrada ? `<p class="texto">Valor de entrada: <strong style="color:#ff5000;">${fmtMoney(d.valor_entrada)}</strong>.</p>` : ''}
    <p class="texto">Forma de pagamento: ( ) PIX &nbsp;&nbsp; ( ) Cartão &nbsp;&nbsp; ( ) Boleto &nbsp;&nbsp; ( ) Transferência</p>

    <h2 class="clausula">CLÁUSULA 5 — ALTERAÇÕES</h2>
    <p class="texto">O cliente terá direito a até <strong>2 (duas)</strong> rodadas de alterações por peça sem custo adicional. Alterações excedentes poderão ser cobradas separadamente conforme tabela vigente.</p>

    <h2 class="clausula">CLÁUSULA 6 — RESPONSABILIDADES</h2>
    <p class="texto">A <strong>CONTRATANTE</strong> se responsabiliza pelo envio correto de informações, textos, imagens e materiais necessários, bem como pela aprovação tempestiva das peças.</p>
    <p class="texto">A <strong>CONTRATADA</strong> se responsabiliza pela execução dos serviços conforme acordado e pelos prazos estabelecidos.</p>

    <h2 class="clausula">CLÁUSULA 7 — CANCELAMENTO</h2>
    <p class="texto">Em caso de cancelamento após o início dos serviços, será necessário aviso prévio de 30 (trinta) dias. Poderá ser cobrada multa proporcional ao trabalho já executado.</p>

    <h2 class="clausula">CLÁUSULA 8 — PROPRIEDADE INTELECTUAL</h2>
    <p class="texto">Todo o material criado pela CONTRATADA para a CONTRATANTE é de propriedade da CONTRATANTE após a quitação integral dos valores devidos.</p>

    <h2 class="clausula">CLÁUSULA 9 — FORO</h2>
    <p class="texto">Fica eleito o foro da comarca de <strong>________________</strong> para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro.</p>
  `;
}

// ─── TEMPLATE 2: Tráfego Pago ──────────────────────────────────────────────
function templateTrafegoPago(d) {
  return `
    <h1 style="text-align:center;text-transform:uppercase;font-size:18px;letter-spacing:2px;margin-bottom:6px;">Contrato de Prestação de Serviços</h1>
    <p style="text-align:center;font-size:13px;color:#555;margin-bottom:30px;">Gestão de Tráfego Pago</p>

    <p style="font-size:13px;text-align:justify;margin-bottom:24px;">Pelo presente instrumento particular:</p>

    <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:16px;margin-bottom:16px;">
      <p style="font-weight:bold;font-size:13px;margin:0 0 10px 0;color:#ff5000;text-transform:uppercase;">CONTRATANTE</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="width:160px;color:#666;padding:3px 0;"><strong>Nome/Razão Social:</strong></td><td>${d.razao_social || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>CPF/CNPJ:</strong></td><td>${d.cpf_cnpj || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Responsável:</strong></td><td>${d.responsavel || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Telefone:</strong></td><td>${d.telefone || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>E-mail:</strong></td><td>${d.email || '_______________________'}</td></tr>
      </table>
    </div>

    <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:16px;margin-bottom:24px;">
      <p style="font-weight:bold;font-size:13px;margin:0 0 10px 0;color:#ff5000;text-transform:uppercase;">CONTRATADA</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="width:160px;color:#666;padding:3px 0;"><strong>Empresa:</strong></td><td>Periférica Agência de Publicidade Ltda - ME</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>CNPJ:</strong></td><td>13.883.869/0003-35</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Telefone:</strong></td><td>(XX) XXXXX-XXXX</td></tr>
      </table>
    </div>

    <h2 class="clausula">CLÁUSULA 1 — OBJETO</h2>
    <p class="texto">O presente contrato tem como objeto a prestação de serviços de gestão de tráfego pago para plataformas digitais como Facebook Ads, Instagram Ads, Google Ads, TikTok Ads e outras.</p>

    <h2 class="clausula">CLÁUSULA 2 — SERVIÇOS INCLUSOS</h2>
    <p class="texto">A CONTRATADA realizará:</p>
    <ul class="lista">
      <li>Criação e configuração de campanhas</li>
      <li>Segmentação e definição de públicos-alvo</li>
      <li>Otimização contínua de campanhas</li>
      <li>Relatórios de desempenho periódicos</li>
      <li>Monitoramento de métricas e KPIs</li>
      <li>Sugestão de criativos e copies</li>
    </ul>

    <h2 class="clausula">CLÁUSULA 3 — INVESTIMENTO EM MÍDIA</h2>
    <p class="texto" style="background:#fff3cd;border-left:4px solid #f59e0b;padding:8px 12px;border-radius:0 4px 4px 0;">
      <strong>ATENÇÃO:</strong> O valor investido em anúncios <strong>NÃO está incluso</strong> no valor da prestação de serviço e será pago diretamente pela CONTRATANTE às plataformas de mídia.
    </p>

    <h2 class="clausula">CLÁUSULA 4 — VALORES</h2>
    <p class="texto">Valor mensal da prestação de serviço: <strong style="color:#ff5000;">${fmtMoney(d.valor_mensal)}</strong>.</p>
    ${d.valor_entrada ? `<p class="texto">Valor de entrada/setup: <strong style="color:#ff5000;">${fmtMoney(d.valor_entrada)}</strong>.</p>` : ''}
    <p class="texto">Forma de pagamento: ( ) PIX &nbsp;&nbsp; ( ) Cartão &nbsp;&nbsp; ( ) Boleto &nbsp;&nbsp; ( ) Transferência</p>
    <p class="texto">Vencimento mensal: dia <strong>____</strong> de cada mês.</p>

    <h2 class="clausula">CLÁUSULA 5 — PRAZO</h2>
    <p class="texto">O presente contrato terá validade a partir de <strong>${fmt(d.data_entrada)}</strong>${d.data_encerramento ? ` até <strong>${fmt(d.data_encerramento)}</strong>` : ', por prazo indeterminado'}.</p>

    <h2 class="clausula">CLÁUSULA 6 — OBRIGAÇÕES DA CONTRATANTE</h2>
    <p class="texto">A CONTRATANTE deverá fornecer: acesso às contas de anúncios, páginas e perfis nas plataformas, materiais criativos quando solicitado, e todas as informações necessárias para execução das campanhas.</p>

    <h2 class="clausula">CLÁUSULA 7 — RESULTADOS</h2>
    <p class="texto">A CONTRATADA não garante resultados específicos de retorno financeiro, pois os resultados dependem de variáveis externas, incluindo o volume de investimento em mídia e o mercado.</p>

    <h2 class="clausula">CLÁUSULA 8 — RESCISÃO</h2>
    <p class="texto">O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de <strong>30 (trinta) dias</strong>.</p>

    <h2 class="clausula">CLÁUSULA 9 — FORO</h2>
    <p class="texto">Fica eleito o foro da comarca de <strong>________________</strong>.</p>
  `;
}

// ─── TEMPLATE 3: Pacote Completo ───────────────────────────────────────────
function templatePacoteCompleto(d) {
  return `
    <h1 style="text-align:center;text-transform:uppercase;font-size:18px;letter-spacing:2px;margin-bottom:6px;">Contrato de Prestação de Serviços</h1>
    <p style="text-align:center;font-size:13px;color:#555;margin-bottom:30px;">Pacote Completo — Social Media, Tráfego, Design & Marketing Digital</p>

    <p style="font-size:13px;text-align:justify;margin-bottom:24px;">Pelo presente instrumento particular:</p>

    <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:16px;margin-bottom:16px;">
      <p style="font-weight:bold;font-size:13px;margin:0 0 10px 0;color:#ff5000;text-transform:uppercase;">CONTRATANTE</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="width:160px;color:#666;padding:3px 0;"><strong>Nome/Razão Social:</strong></td><td>${d.razao_social || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>CPF/CNPJ:</strong></td><td>${d.cpf_cnpj || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Responsável:</strong></td><td>${d.responsavel || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Telefone:</strong></td><td>${d.telefone || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>E-mail:</strong></td><td>${d.email || '_______________________'}</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Endereço:</strong></td><td>${d.endereco || '_______________________'}</td></tr>
      </table>
    </div>

    <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:16px;margin-bottom:24px;">
      <p style="font-weight:bold;font-size:13px;margin:0 0 10px 0;color:#ff5000;text-transform:uppercase;">CONTRATADA</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="width:160px;color:#666;padding:3px 0;"><strong>Empresa:</strong></td><td>Periférica Agência de Publicidade Ltda - ME</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>CNPJ:</strong></td><td>13.883.869/0003-35</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>Telefone:</strong></td><td>(XX) XXXXX-XXXX</td></tr>
        <tr><td style="color:#666;padding:3px 0;"><strong>E-mail:</strong></td><td>contato@periferica.com.br</td></tr>
      </table>
    </div>

    <h2 class="clausula">CLÁUSULA 1 — OBJETO</h2>
    <p class="texto">O presente contrato tem como objeto a prestação de serviços completos de marketing digital, abrangendo social media, design gráfico, gestão de tráfego pago e estratégias de marketing integrado.</p>

    <h2 class="clausula">CLÁUSULA 2 — ESCOPO DOS SERVIÇOS</h2>
    <p class="texto">O pacote completo incluirá:</p>

    <p class="texto" style="font-weight:bold;color:#ff5000;margin-bottom:4px;">Social Media:</p>
    <ul class="lista">
      <li>Criação e gestão de conteúdo para redes sociais</li>
      <li>Planejamento editorial mensal</li>
      <li>Design de posts, stories e reels</li>
      <li>Relatórios de engajamento</li>
    </ul>

    <p class="texto" style="font-weight:bold;color:#ff5000;margin-bottom:4px;">Tráfego Pago:</p>
    <ul class="lista">
      <li>Criação e gestão de campanhas (Meta Ads, Google Ads, TikTok Ads)</li>
      <li>Segmentação de público e otimização</li>
      <li>Relatórios de desempenho e ROAS</li>
    </ul>

    <p class="texto" style="font-weight:bold;color:#ff5000;margin-bottom:4px;">Design & Conteúdo:</p>
    <ul class="lista">
      <li>Criação de materiais digitais e impressos</li>
      <li>Identidade visual e branding</li>
      <li>Criativos para campanhas pagas</li>
    </ul>

    <p class="texto" style="font-weight:bold;color:#ff5000;margin-bottom:4px;">Marketing Estratégico:</p>
    <ul class="lista">
      <li>Consultoria e planejamento estratégico</li>
      <li>Análise de concorrência e mercado</li>
      <li>Reuniões periódicas de alinhamento</li>
    </ul>

    <h2 class="clausula">CLÁUSULA 3 — INVESTIMENTO EM MÍDIA</h2>
    <p class="texto" style="background:#fff3cd;border-left:4px solid #f59e0b;padding:8px 12px;border-radius:0 4px 4px 0;">
      O investimento em anúncios pagos <strong>NÃO está incluso</strong> no valor da prestação de serviço e será pago diretamente pela CONTRATANTE às plataformas.
    </p>

    <h2 class="clausula">CLÁUSULA 4 — VALORES E PAGAMENTO</h2>
    <p class="texto">Valor mensal do pacote completo: <strong style="color:#ff5000;">${fmtMoney(d.valor_mensal)}</strong>.</p>
    ${d.valor_entrada ? `<p class="texto">Valor de entrada: <strong style="color:#ff5000;">${fmtMoney(d.valor_entrada)}</strong>.</p>` : ''}
    <p class="texto">Forma de pagamento: ( ) PIX &nbsp;&nbsp; ( ) Cartão &nbsp;&nbsp; ( ) Boleto &nbsp;&nbsp; ( ) Transferência</p>

    <h2 class="clausula">CLÁUSULA 5 — PRAZO</h2>
    <p class="texto">O contrato terá vigência a partir de <strong>${fmt(d.data_entrada)}</strong>${d.data_encerramento ? ` até <strong>${fmt(d.data_encerramento)}</strong>` : ', com renovação automática mensal'}.</p>

    <h2 class="clausula">CLÁUSULA 6 — ALTERAÇÕES E REVISÕES</h2>
    <p class="texto">A CONTRATANTE terá direito a até <strong>2 (duas)</strong> rodadas de revisão por peça sem custo adicional. Solicitações além deste limite serão orçadas separadamente.</p>

    <h2 class="clausula">CLÁUSULA 7 — RESPONSABILIDADES</h2>
    <p class="texto">A <strong>CONTRATANTE</strong> deverá fornecer em até 5 dias úteis todos os materiais, acessos e informações solicitadas, sob pena de atraso nos entregáveis sem responsabilidade da CONTRATADA.</p>
    <p class="texto">A <strong>CONTRATADA</strong> compromete-se a cumprir os prazos acordados, informar proativamente sobre atualizações e manter sigilo sobre as informações confidenciais da CONTRATANTE.</p>

    <h2 class="clausula">CLÁUSULA 8 — CONFIDENCIALIDADE</h2>
    <p class="texto">Ambas as partes comprometem-se a manter em sigilo todas as informações confidenciais trocadas no âmbito deste contrato.</p>

    <h2 class="clausula">CLÁUSULA 9 — RESCISÃO</h2>
    <p class="texto">O contrato poderá ser rescindido mediante aviso prévio de <strong>30 (trinta) dias</strong>. Em caso de rescisão antecipada sem justa causa pela CONTRATANTE, será devida multa de 30% sobre o valor mensal.</p>

    <h2 class="clausula">CLÁUSULA 10 — PROPRIEDADE INTELECTUAL</h2>
    <p class="texto">Todo material produzido pela CONTRATADA pertence à CONTRATANTE após quitação integral dos valores devidos.</p>

    <h2 class="clausula">CLÁUSULA 11 — FORO</h2>
    <p class="texto">Fica eleito o foro da comarca de <strong>________________</strong> para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro.</p>
  `;
}

function getTemplate(modelo, d) {
  if (modelo === 'social_media') return templateSocialMedia(d);
  if (modelo === 'trafego_pago') return templateTrafegoPago(d);
  if (modelo === 'pacote_completo') return templatePacoteCompleto(d);
  return '';
}

const CSS_CONTRATO = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Arial', sans-serif;
    font-size: 13px;
    color: #222;
    background: #fff;
    padding: 0;
  }
  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 50px;
    min-height: 100vh;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #ff5000;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header-logo {
    font-size: 22px;
    font-weight: 900;
    color: #ff5000;
    letter-spacing: 1px;
  }
  .header-info {
    text-align: right;
    font-size: 11px;
    color: #666;
    line-height: 1.6;
  }
  .status-badge {
    display: inline-block;
    padding: 5px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    margin: 10px 0 20px 0;
  }
  .clausula {
    font-size: 13px;
    font-weight: bold;
    color: #ff5000;
    margin: 20px 0 6px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-left: 3px solid #ff5000;
    padding-left: 8px;
  }
  .texto {
    font-size: 13px;
    line-height: 1.7;
    text-align: justify;
    margin-bottom: 8px;
    color: #333;
  }
  .lista {
    padding-left: 20px;
    margin: 6px 0 10px 0;
  }
  .lista li {
    font-size: 13px;
    line-height: 1.8;
    color: #333;
  }
  .assinaturas {
    margin-top: 60px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    gap: 40px;
  }
  .ass-col {
    flex: 1;
    text-align: center;
  }
  .ass-line {
    border-top: 1px solid #333;
    padding-top: 8px;
    font-size: 12px;
    color: #444;
    margin-top: 60px;
  }
  .footer {
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding-top: 10px;
    text-align: center;
    font-size: 10px;
    color: #999;
  }
  .digital-sig-space {
    margin-top: 16px;
    padding: 10px;
    border: 1px dashed #ccc;
    border-radius: 6px;
    font-size: 11px;
    color: #999;
    text-align: center;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @media print {
    body { padding: 0; }
    .page { padding: 20px 30px; }
    .no-print { display: none !important; }
  }
`;

export default function ContratoFormModal({ open, onClose, lead, onSaved }) {
  const [tab, setTab] = useState('dados');
  const [form, setForm] = useState({
    razao_social: lead?.dados_contrato?.razao_social || lead?.nome_empresa || '',
    cpf_cnpj: lead?.dados_contrato?.cpf_cnpj || '',
    telefone: lead?.dados_contrato?.telefone || lead?.telefone || '',
    email: lead?.dados_contrato?.email || lead?.email || '',
    endereco: lead?.dados_contrato?.endereco || '',
    responsavel: lead?.dados_contrato?.responsavel || lead?.nome_contato || '',
    data_entrada: lead?.dados_contrato?.data_entrada || format(new Date(), 'yyyy-MM-dd'),
    data_encerramento: lead?.dados_contrato?.data_encerramento || '',
    valor_entrada: lead?.dados_contrato?.valor_entrada || '',
    valor_mensal: lead?.dados_contrato?.valor_mensal || '',
    modelo_contrato: lead?.dados_contrato?.modelo_contrato || '',
    status_assinatura: lead?.dados_contrato?.status_assinatura || 'aguardando_assinatura',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSalvar = async () => {
    setSaving(true);
    const user = await localApp.auth.me();
    const modeloLabel = MODELOS.find(m => m.value === form.modelo_contrato)?.label || form.modelo_contrato;
    const statusLabel = STATUS_ASSINATURA.find(s => s.value === form.status_assinatura)?.label || '';
    const hist = [...(lead.historico || []), {
      data: new Date().toISOString(),
      usuario_email: user.email,
      usuario_nome: user.full_name,
      status_anterior: lead.status,
      status_novo: 'contrato',
      observacao: `Contrato salvo: ${modeloLabel} · Status: ${statusLabel}`,
    }];
    await localApp.entities.CRMLead.update(lead.id, {
      status: 'contrato',
      dados_contrato: {
        ...form,
        modelo_contrato: form.modelo_contrato,
        valor_entrada: Number(form.valor_entrada),
        valor_mensal: Number(form.valor_mensal),
      },
      historico: hist,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleImprimir = () => {
    const d = { ...form, valor_entrada: Number(form.valor_entrada), valor_mensal: Number(form.valor_mensal) };
    const modeloLabel = MODELOS.find(m => m.value === d.modelo_contrato)?.label || d.modelo_contrato;
    const statusLabel = STATUS_ASSINATURA.find(s => s.value === d.status_assinatura)?.label || '';
    const statusColor = d.status_assinatura === 'contrato_assinado' ? '#16a34a' : '#d97706';
    const templateHTML = getTemplate(d.modelo_contrato, d);
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${modeloLabel} — ${d.razao_social}</title>
  <style>${CSS_CONTRATO}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="header-logo">Periférica</div>
        <div style="font-size:11px;color:#666;margin-top:2px;">Agência de Publicidade Ltda - ME</div>
      </div>
      <div class="header-info">
        CNPJ: 13.883.869/0003-35<br/>
        Emitido em: ${dataAtual}<br/>
        <strong>${modeloLabel}</strong>
      </div>
    </div>

    <div style="text-align:center;">
      <span class="status-badge" style="background:${statusColor};">${statusLabel}</span>
    </div>

    ${templateHTML}

    <div class="assinaturas">
      <div class="ass-col">
        <div class="digital-sig-space">
          [ Espaço para assinatura digital ]
        </div>
        <div class="ass-line">
          Assinatura do Contratante<br/>
          <strong>${d.razao_social || '_______________________'}</strong><br/>
          CPF/CNPJ: ${d.cpf_cnpj || '_______________________'}
        </div>
      </div>
      <div class="ass-col">
        <div class="digital-sig-space">
          [ Espaço para assinatura digital ]
        </div>
        <div class="ass-line">
          Assinatura da Contratada<br/>
          <strong>Periférica Agência de Publicidade Ltda - ME</strong><br/>
          CNPJ: 13.883.869/0003-35
        </div>
      </div>
    </div>

    <p style="text-align:center;font-size:13px;margin-top:30px;color:#444;">
      Local e Data: ________________________, ${dataAtual}
    </p>

    <div class="footer">
      Periférica Agência de Publicidade Ltda - ME · CNPJ 13.883.869/0003-35 · contato@periferica.com.br<br/>
      Documento gerado em ${dataAtual} pelo sistema interno Periférica.
    </div>

    <div class="no-print" style="margin-top:24px;text-align:center;">
      <button onclick="window.print()" style="background:#ff5000;color:#fff;border:none;padding:10px 28px;font-size:14px;border-radius:6px;cursor:pointer;font-weight:bold;">
        🖨️ Imprimir / Salvar PDF
      </button>
    </div>
  </div>
</body>
</html>`);
    w.document.close();
  };

  const modeloAtual = MODELOS.find(m => m.value === form.modelo_contrato);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#ff5000]" />
            Contrato — {lead?.nome_empresa}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="bg-[#1a1a2e] border border-white/10 w-full">
            <TabsTrigger value="dados" className="flex-1 data-[state=active]:bg-[#ff5000] data-[state=active]:text-white">
              Dados do contrato
            </TabsTrigger>
            <TabsTrigger value="imprimir" className="flex-1 data-[state=active]:bg-[#ff5000] data-[state=active]:text-white">
              <Printer className="w-3.5 h-3.5 mr-1.5" />Imprimir PDF
            </TabsTrigger>
          </TabsList>

          {/* Aba de dados */}
          <TabsContent value="dados" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-gray-400 text-xs mb-1 block">Modelo de contrato *</Label>
                <Select value={form.modelo_contrato} onValueChange={v => set('modelo_contrato', v)}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectValue placeholder="Selecione o modelo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label className="text-gray-400 text-xs mb-1 block">Status de assinatura</Label>
                <Select value={form.status_assinatura} onValueChange={v => set('status_assinatura', v)}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ASSINATURA.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-400 text-xs mb-1 block">Nome completo / Razão social</Label>
                <Input value={form.razao_social} onChange={e => set('razao_social', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">CPF / CNPJ</Label>
                <Input value={form.cpf_cnpj} onChange={e => set('cpf_cnpj', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">Telefone</Label>
                <Input value={form.telefone} onChange={e => set('telefone', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">E-mail</Label>
                <Input value={form.email} onChange={e => set('email', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-gray-400 text-xs mb-1 block">Endereço</Label>
                <Input value={form.endereco} onChange={e => set('endereco', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">Responsável</Label>
                <Input value={form.responsavel} onChange={e => set('responsavel', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">Data de entrada</Label>
                <Input type="date" value={form.data_entrada} onChange={e => set('data_entrada', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">Data de encerramento</Label>
                <Input type="date" value={form.data_encerramento} onChange={e => set('data_encerramento', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1 block">Valor de entrada (R$)</Label>
                <Input type="number" value={form.valor_entrada} onChange={e => set('valor_entrada', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-gray-400 text-xs mb-1 block">Valor mensal (R$)</Label>
                <Input type="number" value={form.valor_mensal} onChange={e => set('valor_mensal', e.target.value)} className="bg-[#1a1a2e] border-white/10 text-white" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
              <Button
                onClick={handleSalvar}
                disabled={saving || !form.modelo_contrato || !form.razao_social}
                className="flex-1 gradient-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar contrato'}
              </Button>
            </div>
          </TabsContent>

          {/* Aba de impressão */}
          <TabsContent value="imprimir" className="pt-4 space-y-4">
            {form.modelo_contrato ? (
              <div className="rounded-xl border border-[#ff5000]/20 bg-[#1a1a2e] p-5 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#ff5000]" />
                  <span className="text-white font-medium text-sm">{modeloAtual?.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div className="text-gray-500">Empresa: <span className="text-gray-300">{form.razao_social || '—'}</span></div>
                  <div className="text-gray-500">Responsável: <span className="text-gray-300">{form.responsavel || '—'}</span></div>
                  <div className="text-gray-500">CPF/CNPJ: <span className="text-gray-300">{form.cpf_cnpj || '—'}</span></div>
                  <div className="text-gray-500">Telefone: <span className="text-gray-300">{form.telefone || '—'}</span></div>
                  <div className="text-gray-500">Valor mensal: <span className="text-[#ff5000] font-semibold">R$ {Number(form.valor_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  <div className="text-gray-500">Entrada: <span className="text-[#ff5000] font-semibold">R$ {Number(form.valor_entrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  <div className="text-gray-500">Início: <span className="text-gray-300">{form.data_entrada ? new Date(form.data_entrada + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
                  <div className="text-gray-500">Status: <span className={form.status_assinatura === 'contrato_assinado' ? 'text-green-400' : 'text-yellow-400'}>
                    {STATUS_ASSINATURA.find(s => s.value === form.status_assinatura)?.label}
                  </span></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">O PDF gerado incluirá o template completo do contrato com todos os campos preenchidos, cláusulas, cabeçalho da empresa e espaço para assinatura digital.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <p className="text-xs text-yellow-400">⚠ Selecione o modelo de contrato na aba "Dados" antes de imprimir.</p>
              </div>
            )}

            <Button
              onClick={handleImprimir}
              disabled={!form.modelo_contrato}
              className="w-full gradient-primary"
            >
              <Printer className="w-4 h-4 mr-2" />Gerar e Abrir PDF
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}