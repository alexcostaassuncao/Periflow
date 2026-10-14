import React from 'react';
import { format } from 'date-fns';

export default function ContractPrint({ contract }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-black min-h-screen p-12 max-w-4xl mx-auto">
      <style>{`
        @media print {
          body { 
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
          .print-section { page-break-inside: avoid; }
        }
        
        .contract-header {
          display: flex;
          align-items: start;
          justify-content: space-between;
          margin-bottom: 40px;
          border-bottom: 3px solid #ff5000;
          padding-bottom: 20px;
        }
        
        .contract-title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          margin: 30px 0;
          color: #333;
        }
        
        .contract-section {
          margin: 25px 0;
        }
        
        .contract-section h3 {
          font-size: 16px;
          font-weight: bold;
          color: #ff5000;
          margin-bottom: 12px;
        }
        
        .contract-section p {
          line-height: 1.8;
          margin: 8px 0;
          color: #333;
        }
        
        .signature-area {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid #ddd;
        }
        
        .signature-line {
          margin: 40px 0;
          text-align: center;
        }
        
        .signature-line div {
          border-top: 2px solid #333;
          width: 300px;
          margin: 0 auto 10px;
          padding-top: 10px;
        }
      `}</style>

      {/* Header */}
      <div className="contract-header">
        <div>
          <div className="w-20 h-20 bg-[#ff5000] rounded-xl flex items-center justify-center text-white text-3xl font-bold">
            P
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-[#ff5000]">Periférica Agência de Publicidade</h2>
          <p className="text-sm text-gray-600">CNPJ: 13.883.869/0003-35</p>
          <p className="text-sm text-gray-600">Criciúma, SC</p>
          <p className="text-sm text-gray-600">CNAE M-7311-4/00</p>
        </div>
      </div>

      <div className="contract-title">
        CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL
      </div>

      <div className="text-center mb-8">
        <p className="font-bold">CONTRATO Nº: {contract.contract_number}</p>
        <p className="text-sm text-gray-600">
          DATA: {contract.created_date ? format(new Date(contract.created_date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
        </p>
      </div>

      {/* Seção 1 - Partes */}
      <div className="contract-section print-section">
        <h3>1. DAS PARTES</h3>
        <p><strong>CONTRATADA:</strong></p>
        <p>Periférica Agência de Publicidade Ltda - ME, inscrita no CNPJ sob nº 13.883.869/0003-35, com sede em Criciúma, SC.</p>
        
        <p className="mt-4"><strong>CONTRATANTE:</strong></p>
        <p>{contract.client_name}, inscrito no {contract.client_cpf_cnpj?.length > 14 ? 'CNPJ' : 'CPF'} sob nº {contract.client_cpf_cnpj || 'N/A'}, com endereço em {contract.client_address || 'N/A'}.</p>
        <p>Telefone: {contract.client_phone || 'N/A'}</p>
        <p>E-mail: {contract.client_email || 'N/A'}</p>
      </div>

      {/* Seção 2 - Objeto */}
      <div className="contract-section print-section">
        <h3>2. DO OBJETO</h3>
        <p>O presente contrato tem como objeto a prestação de serviços de marketing digital, incluindo criação de conteúdos, gestão de redes sociais e produção de materiais gráficos, conforme plano contratado.</p>
      </div>

      {/* Seção 3 - Serviços */}
      <div className="contract-section print-section">
        <h3>3. DOS SERVIÇOS CONTRATADOS</h3>
        <p style={{ whiteSpace: 'pre-line' }}>{contract.services || 'Serviços conforme plano contratado.'}</p>
      </div>

      {/* Seção 4 - Prazo */}
      <div className="contract-section print-section">
        <h3>4. DO PRAZO</h3>
        <p>
          O presente contrato tem vigência de {contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : 'N/A'} até{' '}
          {contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : 'prazo indeterminado'}, 
          {contract.contract_duration && ` com duração de ${contract.contract_duration} meses, `}
          podendo ser renovado mediante acordo entre as partes.
        </p>
      </div>

      {/* Seção 5 - Valor */}
      <div className="contract-section print-section">
        <h3>5. DO VALOR</h3>
        <p>
          Pelos serviços descritos neste contrato, o CONTRATANTE pagará à CONTRATADA o valor total de:
        </p>
        <p className="font-bold text-lg mt-2">
          R$ {contract.monthly_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
          ({contract.contract_duration > 1 ? 'mensais' : ''}).
        </p>
      </div>

      {/* Seção 6 - Pagamento */}
      <div className="contract-section print-section">
        <h3>6. DA FORMA DE PAGAMENTO</h3>
        <p>O pagamento será realizado da seguinte forma:</p>
        <p><strong>Forma de pagamento:</strong> {contract.payment_method === 'boleto' ? 'Boleto' : contract.payment_method === 'pix' ? 'PIX' : contract.payment_method === 'transferencia' ? 'Transferência' : contract.payment_method === 'cartao' ? 'Cartão de Crédito' : 'Mensal'}</p>
        <p><strong>Vencimento:</strong> Todo dia {contract.payment_day || '10'}</p>
      </div>

      {/* Seção 7 - Obrigações Contratada */}
      <div className="contract-section print-section">
        <h3>7. DAS OBRIGAÇÕES DA CONTRATADA</h3>
        <p>• Executar os serviços conforme o escopo acordado</p>
        <p>• Cumprir os prazos estabelecidos</p>
        <p>• Manter comunicação clara com o CONTRATANTE</p>
        <p>• Fornecer relatórios de desempenho quando solicitado</p>
      </div>

      {/* Seção 8 - Obrigações Contratante */}
      <div className="contract-section print-section">
        <h3>8. DAS OBRIGAÇÕES DO CONTRATANTE</h3>
        <p>• Fornecer informações necessárias para execução dos serviços</p>
        <p>• Realizar os pagamentos nos prazos acordados</p>
        <p>• Aprovar ou solicitar ajustes dentro dos prazos definidos</p>
        <p>• Fornecer acesso às plataformas quando necessário</p>
      </div>

      {/* Seção 9 - Ajustes */}
      <div className="contract-section print-section">
        <h3>9. DOS AJUSTES</h3>
        <p>Cada entrega poderá conter até 2 (dois) ajustes, desde que solicitados de forma objetiva e dentro do prazo de 48 horas após a apresentação. Ajustes adicionais poderão ser cobrados à parte.</p>
      </div>

      {/* Seção 10 - Cancelamento */}
      <div className="contract-section print-section">
        <h3>10. DO CANCELAMENTO</h3>
        <p>O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias, não isentando o pagamento de valores já devidos ou serviços já prestados.</p>
      </div>

      {/* Seção 11 - Propriedade */}
      <div className="contract-section print-section">
        <h3>11. DA PROPRIEDADE INTELECTUAL</h3>
        <p>Todos os materiais criados pela CONTRATADA são de propriedade do CONTRATANTE após a quitação do pagamento, podendo ser utilizados livremente.</p>
      </div>

      {/* Seção 12 - Foro */}
      <div className="contract-section print-section">
        <h3>12. DO FORO</h3>
        <p>Fica eleito o foro da comarca de Criciúma/SC para dirimir quaisquer dúvidas oriundas deste contrato.</p>
      </div>

      {/* Observações */}
      {contract.notes && (
        <div className="contract-section print-section">
          <h3>13. OBSERVAÇÕES</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{contract.notes}</p>
        </div>
      )}

      {/* Assinatura */}
      <div className="signature-area">
        <p className="text-center font-bold mb-8">Por estarem de acordo, as partes assinam o presente contrato.</p>
        
        <div className="grid grid-cols-2 gap-12 mt-12">
          <div className="signature-line">
            <div></div>
            <p className="font-medium">CONTRATADA</p>
            <p className="text-sm text-gray-600">Periférica Agência de Publicidade</p>
          </div>
          
          <div className="signature-line">
            <div></div>
            <p className="font-medium">CONTRATANTE</p>
            <p className="text-sm text-gray-600">{contract.client_name}</p>
          </div>
        </div>

        <p className="text-center mt-12 text-sm text-gray-600">
          DATA: ___ / ___ / _______
        </p>
      </div>

      <button 
        onClick={handlePrint}
        className="no-print fixed bottom-8 right-8 bg-[#ff5000] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-[#cc4000] transition-all"
      >
        🖨️ Imprimir Contrato
      </button>
    </div>
  );
}