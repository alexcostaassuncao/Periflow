import React, { useState, useEffect, useRef } from 'react';
import { localApp } from '@/api/localClient';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Camera, 
  Clock, 
  CheckCircle, 
  XCircle,
  Play,
  Square,
  History,
  Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function TimeTracker() {
  const [user, setUser] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [weekRecords, setWeekRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [captureType, setCaptureType] = useState('check_in');
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);

      const today = format(new Date(), 'yyyy-MM-dd');
      const records = await localApp.entities.TimeRecord.filter({ employee_email: currentUser.email });
      
      const todayRec = records.find(r => r.date === today);
      setTodayRecord(todayRec);
      setWeekRecords(records.slice(0, 7));
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async (type) => {
    setCaptureType(type);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.log('Camera error:', error);
      alert('Não foi possível acessar a câmera');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    const file = new File([blob], `${captureType}_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    const { file_url } = await localApp.integrations.Core.UploadFile({ file });

    const today = format(new Date(), 'yyyy-MM-dd');
    const currentTimeStr = format(new Date(), 'HH:mm');

    if (captureType === 'check_in') {
      const newRecord = await localApp.entities.TimeRecord.create({
        employee_email: user.email,
        date: today,
        check_in_time: currentTimeStr,
        check_in_photo: file_url,
        status: 'checked_in',
        notes: notes
      });
      setTodayRecord(newRecord);
    } else {
      const checkInTime = todayRecord.check_in_time.split(':').map(Number);
      const checkOutTime = currentTimeStr.split(':').map(Number);
      const totalHours = (checkOutTime[0] - checkInTime[0]) + (checkOutTime[1] - checkInTime[1]) / 60;

      await localApp.entities.TimeRecord.update(todayRecord.id, {
        check_out_time: currentTimeStr,
        check_out_photo: file_url,
        status: 'completed',
        total_hours: Math.max(0, totalHours),
        notes: notes || todayRecord.notes
      });
      setTodayRecord(prev => ({
        ...prev,
        check_out_time: currentTimeStr,
        check_out_photo: file_url,
        status: 'completed',
        total_hours: Math.max(0, totalHours)
      }));
    }

    stopCamera();
    setNotes('');
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const getRecordForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return weekRecords.find(r => r.date === dateStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCheckedIn = todayRecord?.status === 'checked_in';
  const isCompleted = todayRecord?.status === 'completed';

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Ponto Diário</h1>
        <p className="text-gray-400 mt-1">Registre sua entrada e saída</p>
      </div>

      {/* Current Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 text-center"
      >
        <p className="text-gray-400 mb-2">
          {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
        <motion.p 
          className="text-6xl md:text-7xl font-bold text-[#ff5000]"
          key={currentTime.toISOString()}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
        >
          {format(currentTime, 'HH:mm:ss')}
        </motion.p>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`glass-card rounded-2xl p-6 border-2 ${
          isCompleted ? 'border-green-500/30' : 
          isCheckedIn ? 'border-blue-500/30' : 'border-[#ff5000]/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isCompleted ? 'bg-green-500/20' : 
              isCheckedIn ? 'bg-blue-500/20' : 'bg-[#ff5000]/20'
            }`}>
              {isCompleted ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : isCheckedIn ? (
                <Clock className="w-8 h-8 text-blue-400" />
              ) : (
                <Play className="w-8 h-8 text-[#ff5000]" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {isCompleted ? 'Jornada Finalizada' : 
                 isCheckedIn ? 'Em Expediente' : 'Aguardando Check-in'}
              </h3>
              <p className="text-gray-400 text-sm">
                {isCompleted ? `${todayRecord.total_hours?.toFixed(1)}h trabalhadas` :
                 isCheckedIn ? `Entrada: ${todayRecord.check_in_time}` : 'Registre sua entrada'}
              </p>
            </div>
          </div>

          {!isCompleted && (
            <Button
              onClick={() => startCamera(isCheckedIn ? 'check_out' : 'check_in')}
              className={`${isCheckedIn ? 'bg-red-500 hover:bg-red-600' : 'gradient-primary hover:opacity-90'} px-6`}
            >
              <Camera className="w-5 h-5 mr-2" />
              {isCheckedIn ? 'Check-out' : 'Check-in'}
            </Button>
          )}
        </div>

        {todayRecord && (
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="p-4 rounded-xl bg-[#1a1a2e]">
              <p className="text-xs text-gray-500 mb-1">Entrada</p>
              <p className="font-bold text-lg text-green-400">
                {todayRecord.check_in_time || '--:--'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#1a1a2e]">
              <p className="text-xs text-gray-500 mb-1">Saída</p>
              <p className="font-bold text-lg text-red-400">
                {todayRecord.check_out_time || '--:--'}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Week Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#ff5000]" />
          Resumo da Semana
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {getWeekDays().map((day, index) => {
            const record = getRecordForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={index}
                className={`p-3 rounded-xl text-center ${
                  isToday ? 'bg-[#ff5000]/20 border border-[#ff5000]/50' : 'bg-[#1a1a2e]'
                }`}
              >
                <p className="text-xs text-gray-500 mb-1">
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className={`font-bold ${isToday ? 'text-[#ff5000]' : ''}`}>
                  {format(day, 'd')}
                </p>
                <div className="mt-2">
                  {record?.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  ) : record?.status === 'checked_in' ? (
                    <Clock className="w-5 h-5 text-blue-400 mx-auto" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-700 mx-auto" />
                  )}
                </div>
                {record?.total_hours && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {record.total_hours.toFixed(1)}h
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-[#ff5000]" />
          Histórico Recente
        </h3>
        <div className="space-y-3">
          {weekRecords.filter(r => r.status === 'completed').slice(0, 5).map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a2e]">
              <div className="flex items-center gap-4">
                {record.check_in_photo && (
                  <img src={record.check_in_photo} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium">
                    {format(new Date(record.date), "d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-400">
                    {record.check_in_time} - {record.check_out_time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#ff5000]">{record.total_hours?.toFixed(1)}h</p>
              </div>
            </div>
          ))}
          {weekRecords.filter(r => r.status === 'completed').length === 0 && (
            <p className="text-center text-gray-500 py-4">Nenhum registro completado</p>
          )}
        </div>
      </motion.div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative w-full max-w-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-2xl"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                    <p className="text-sm font-medium">
                      {captureType === 'check_in' ? '📸 Check-in' : '📸 Check-out'}
                    </p>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 glass-card border-t border-white/10">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações (opcional)..."
                className="bg-[#1a1a2e] border-white/10 mb-4"
              />
              <div className="flex gap-4">
                <Button variant="outline" onClick={stopCamera} className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
                  Cancelar
                </Button>
                <Button onClick={capturePhoto} className="flex-1 gradient-primary">
                  <Camera className="w-5 h-5 mr-2" />
                  Capturar e Registrar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}