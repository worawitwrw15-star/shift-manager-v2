'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle2, Circle, Sun, Moon, User, Plus, Trash2, Edit3, Save, X, Calendar, Copy, Check, ShieldCheck, CopyPlus, RefreshCw, Sparkles, CheckCheck } from 'lucide-react';

interface Task {
  id: string;
  time: string;
  staff_name: string;
  role: string;
  action_detail: string;
  is_completed: boolean;
  shift: 'morning' | 'night';
  task_date: string;
}

const MORNING_TIMES = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

const NIGHT_TIMES = [
  '20:00', '21:00', '22:00', '23:00', '00:00', 
  '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'
];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<'morning' | 'night'>('morning');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const [tnMcName, setTnMcName] = useState('เอก[Z3]');
  const [supportTnName, setSupportTnName] = useState('พี่เอ้ [SL]');
  const [isEditingLeaders, setIsEditingLeaders] = useState(false);

  // คำนวณจำนวนงานที่เสร็จและเปอร์เซ็นต์
  const completedTasksCount = tasks.filter(t => t.is_completed).length;
  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // ระบบดึงวันที่และเวลาปัจจุบันแบบ Realtime
  useEffect(() => {
    const updateRealtimeDateAndShift = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDateString = `${year}-${month}-${day}`;

      setSelectedDate(currentDateString);
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));

      const currentHour = now.getHours();
      if (currentHour >= 7 && currentHour < 19) {
        setSelectedShift('morning');
      } else {
        setSelectedShift('night');
      }
    };

    updateRealtimeDateAndShift();
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedShift === 'morning') {
      setTnMcName('เอก [Z3]');
      setSupportTnName('พี่เอ้ [SL]');
    } else {
      setTnMcName('ท็อป [Z3]');
      setSupportTnName('กีกี้ [SL]');
    }
  }, [selectedShift]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newRole, setNewRole] = useState('MC');
  const [isOt, setIsOt] = useState(false);
  const [newActionDetail, setNewActionDetail] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editStaffName, setEditStaffName] = useState('');
  const [editActionDetail, setEditActionDetail] = useState('');
  const [editRole, setEditRole] = useState('MC');
  const [editIsOt, setEditIsOt] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchTasks();
    }
  }, [selectedShift, selectedDate]);

  const currentAvailableTimes = (selectedShift === 'morning' ? MORNING_TIMES : NIGHT_TIMES)
    .filter(t => !tasks.some(task => task.time === t));

  useEffect(() => {
    if (currentAvailableTimes.length > 0) {
      setNewTime(currentAvailableTimes[0]);
    } else {
      setNewTime('');
    }
  }, [selectedShift, tasks]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('shift', selectedShift)
      .eq('task_date', selectedDate)
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleRotateTasks = async () => {
    if (tasks.length < 2) {
      alert('ต้องมีรายการงานอย่างน้อย 2 รายการขึ้นไปจึงจะหมุนเวียนเวรได้ครับ');
      return;
    }

    if (!confirm('คุณต้องการหมุนเวียนสลับช่วงเวลาและหน้าที่ของพนักงานใช่หรือไม่?')) {
      return;
    }

    setRotating(true);

    const staffList = tasks.map(t => ({ staff_name: t.staff_name, role: t.role }));
    
    const rotatedStaffList = [
      staffList[staffList.length - 1],
      ...staffList.slice(0, staffList.length - 1)
    ];

    const updatePromises = tasks.map((task, index) => {
      const newStaff = rotatedStaffList[index];
      return supabase
        .from('daily_tasks')
        .update({
          staff_name: newStaff.staff_name,
          role: newStaff.role
        })
        .eq('id', task.id);
    });

    await Promise.all(updatePromises);
    await fetchTasks();
    setRotating(false);
  };

  const handleCloneYesterdayTasks = async () => {
    const currentDateObj = new Date(selectedDate);
    currentDateObj.setDate(currentDateObj.getDate() - 1);
    const yesterdayDate = currentDateObj.toISOString().split('T')[0];

    if (!confirm(`คุณต้องการดึงตารางงาน (${selectedShift === 'morning' ? 'กะเช้า' : 'กะดึก'}) จากวันที่ ${yesterdayDate} มาใส่ในวันที่ ${selectedDate} ใช่หรือไม่?`)) {
      return;
    }

    setCloning(true);

    const { data: yesterdayTasks, error: fetchErr } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('shift', selectedShift)
      .eq('task_date', yesterdayDate);

    if (fetchErr || !yesterdayTasks || yesterdayTasks.length === 0) {
      alert(`ไม่พบตารางงานในวันที่ ${yesterdayDate} ให้คัดลอกครับ`);
      setCloning(false);
      return;
    }

    const newTasksToInsert = yesterdayTasks.map(t => ({
      time: t.time,
      staff_name: t.staff_name,
      role: t.role,
      action_detail: t.action_detail,
      shift: selectedShift,
      task_date: selectedDate,
      is_completed: false
    }));

    const { data: insertedData, error: insertErr } = await supabase
      .from('daily_tasks')
      .insert(newTasksToInsert)
      .select();

    if (insertErr) {
      console.error('Error cloning tasks:', insertErr);
      alert('เกิดข้อผิดพลาดในการคัดลอกตารางงาน');
    } else {
      setTasks([...tasks, ...(insertedData || [])].sort((a, b) => a.time.localeCompare(b.time)));
      alert(`คัดลอกตารางงานเรียบร้อยแล้ว (${insertedData?.length || 0} รายการ)`);
    }

    setCloning(false);
  };

  const toggleTaskStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('daily_tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (!error) {
      setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime) {
      alert('เวลาทั้งหมดในกะนี้ถูกใช้งานเต็มแล้วครับ');
      return;
    }
    if (!newStaffName || !newActionDetail) return;

    const finalStaffName = isOt && !newStaffName.trim().endsWith('OT') 
      ? `${newStaffName.trim()} OT` 
      : newStaffName.trim();

    const newTask = {
      time: newTime,
      staff_name: finalStaffName,
      role: newRole,
      action_detail: newActionDetail,
      shift: selectedShift,
      task_date: selectedDate,
      is_completed: false
    };

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert([newTask])
      .select();

    if (!error && data) {
      setTasks([...tasks, data[0]].sort((a, b) => a.time.localeCompare(b.time)));
      setNewStaffName('');
      setNewActionDetail('');
      setIsOt(false);
      setShowAddForm(false);
    }
  };

  const handleDeleteTask = async (id: string, name: string) => {
    if (confirm(`คุณต้องการลบพนักงาน/งานของ "${name}" ใช่หรือไม่?`)) {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id);

      if (!error) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTime(task.time);
    const hasOt = task.staff_name.endsWith(' OT');
    setEditStaffName(hasOt ? task.staff_name.replace(/ OT$/, '') : task.staff_name);
    setEditIsOt(hasOt);
    setEditRole(task.role);
    setEditActionDetail(task.action_detail);
  };

  const handleSaveEdit = async (id: string) => {
    const finalStaffName = editIsOt && !editStaffName.trim().endsWith('OT')
      ? `${editStaffName.trim()} OT`
      : editStaffName.trim();

    const { error } = await supabase
      .from('daily_tasks')
      .update({
        time: editTime,
        staff_name: finalStaffName,
        role: editRole,
        action_detail: editActionDetail
      })
      .eq('id', id);

    if (!error) {
      const updatedList = tasks.map(t => 
        t.id === id 
          ? { ...t, time: editTime, staff_name: finalStaffName, role: editRole, action_detail: editActionDetail } 
          : t
      );
      setTasks(updatedList.sort((a, b) => a.time.localeCompare(b.time)));
      setEditingId(null);
    }
  };

  const handleCopyReport = () => {
    const formattedDate = selectedDate.split('-').reverse().join(' / ');
    const shiftTitle = selectedShift === 'morning' ? 'MC  กะเช้า' : 'MC ดึก';

    let reportText = `หน้าที่ประจำวันที่ ${formattedDate}\n\n${shiftTitle}\n\n`;

    reportText += `TN.MC : ${tnMcName}
- ช่วย ดูแลไลน์ U-coin Rank [Diamond]
- ช่วยรับรายการเวลาไลน์แอดค้าง
- แนะนำแนวทางแก้ไขปัญหาต่างๆให้ MC. 
- ตรวจสอบการตอบและทำรายการแก้ไขปัญหาให้ลูกค้า
- ตรวจสอบการตามลูกค้า ชาย / หญิง
- ตรวจสอบและอัปเดตแพทเทิร์นให้เป็นปัจจุบัน และ ตรงตามที่แผนก Quality Assurance กำหนด
- อัปเดตข้อความต้อนรับไลน์แอดให้ดูมีความน่าสนใจ
- เช็คและมอบหมายหน้าที่งานและกระจายงานให้กับ MC
- อัปเดตรูป ลิงก์ และแพทเทิร์น ข้อความทักทายเพื่อนใหม่ ให้ทันสมัย
- ติดต่อประสานงานกับส่วนกลางผ่านแอป U-Chat
- อัปเดตเบอร์โทรศัพท์หน้างาน MC
${selectedShift === 'morning' ? '- Ag Balance ( ทุกๆ กะเข้าวันจันทร์ )\n' : ''}- ดูแลอัปเดตหน้า Membe / Pop up เพื่อให้หน้าเว็บดูน่าสนใจ  
- มอบหมายหน้าที่งานประจำวันให้กับ MC
- ลงข้อมูล Report Google Group ตามที่ส่วนกลางกำหนด
- คอยอัปเดตรูปที่หน้างานจำเป็นที่ต้องใช้ และ บรีฟงานกับ Graphic เพื่อสั่งรูปใหม่
- ตรวจสอบกลุ่ม Telegram Graphic คอยดึงรูปโปรโมทต่างๆที่น่าสนใจออกมาเพื่อการตามลูกค้า
- เช็คสแปมไลน์แอดทั้งหมดที่ MC. ดูแล
- กำหนด Product ในการตามลูกค้าให้ทุกคนในทีม และ เวลาที่เหมาะสม
- อัปเดตกาดร์กีฬารายวัน ,และ โปรโมชั่นต่างๆ 
- เช็ค OTP หน้าเว็บ
- ตรวจสอบการ CR ลูกค้าต่างๆ และการเปลี่ยนหัวให้เป็นไปตามนโยบายบริษัท
- เช็คไอพีสำหรับยูสเซอร์ New Member
- สรุปตาราง Dropbox Report 
- ช่วยรับรายการเวลาไลน์แอดค้าง
- เเจ้ง TALK TALK
 @345 Customer Care / @MC345 SERVICEZ 345 / @ing345 ING345 / @วาร์ป

Support.TN ${supportTnName}
- รีพาส /อัปเดตลบ+เพิ่ม ข้อมูล
- Support TN.MC สรุปตาราง Dropbox Report 
- เช็คสแปมไลน์แอดทั้งหมดที่ MC. ดูแล 
- QA ตารางแนะนำเพื่อน
- เช็คกิจกรรมและโปรโมชั่นต่างๆ ที่มี พร้อมนำเสนอลูกค้า
- ตรวจสอบกลุ่ม Telegram Graphic คอยดึงรูปโปรโมทต่างๆที่น่าสนใจออกมาเพื่อการตามลูกค้า
- อัปเดตรูป ลิงก์ และแพทเทิร์น ข้อความทักทายเพื่อนใหม่ให้ทันสมัย และน่าสนใจ
- ดูและ Popup - Member ให้เป็นไปตามแพลนงานของบริษัท และได้รับการอนุมัติจาก TN.
- สนับสนุนงาน TN.MC ในทุกภารกิจที่ได้รับมอบหมาย ให้เป็นไปตามนโยบายของบริษัทและ South Group
- ดูแลรายการสมัครหน้าเว็บและดีด
${selectedShift === 'morning' ? '- ตามลูกค้าไลน์หลักเมื่อวาน / ปัจจุบัน / ทีมตามMC (ชาย/หญิง)\n' : ''}- เก็บตกหล่น
-  มอบหมายเปลี่ยนหัว CR ให้พนักงาน
- ดูแลและบริการการแก้ไขปัญหา แนะนำกิจกรรมให้ลูกค้า
- เปลี่ยนริชเมนูที่ไลน์ MC และ CALL ตอนเที่ยงคืน
${selectedShift === 'night' ? '- สรุปตาราง Dropbox Report \n' : ''}- @UFA345V1  / @MC345 SERVICE / @ing345 ING345 / @วาร์ป\n\n`;

    reportText += `📍 หลักการตามลูกค้า 🚩 แยกชาย-หญิง และหากมีโน๊ต ประเภทที่ลค.สนใจ\nING, ไลน์หลัก   =  วันนี้ + เมื่อวาน และ แท็กทีมตามMC   \n------------------------------------\n\n🚩หน้าที่หลักของ พนง. MC ที่ต้องช่วยกัน !!\n\n- 5 LINE@ หลักที่ต้องดูแลช่วยกัน [345สมัคร, ไลน์หลัก, ING, SERVICE และ ทำไมไม่วาร์ป]\n-  ตามแจ้งเคสถอนใน Talk Talk 📌\n-  รับ+ดีด รายการหน้าเว็บ\n-  เก็บตกหล่น\n\nนอกเหนือจากนี้ มีการแบ่งหน้าที่ให้ชัดเจนแล้ว ตามนี้ค่ะ\n\n`;

    tasks.forEach(task => {
      reportText += `- ${task.role} : ${task.staff_name}\n`;
      reportText += `- 🕘 ${task.time} น. ${task.action_detail}\n`;
      reportText += `🕰 เก็บตกหล่น\n\n`;
    });

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-sky-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">Live Real-Time</span>
                {currentTime && <span className="text-xs text-slate-400 font-mono">({currentTime} น.)</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                ระบบจัดการหน้าที่ประจำวัน
              </h1>
            </div>

            {/* Shift Selector */}
            <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shadow-inner w-full md:w-auto">
              <button
                onClick={() => setSelectedShift('morning')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  selectedShift === 'morning' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Sun className="w-4 h-4" /> กะเช้า
              </button>
              <button
                onClick={() => setSelectedShift('night')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  selectedShift === 'night' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Moon className="w-4 h-4" /> กะดึก
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 relative z-10">
            <div className="flex items-center gap-2.5 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800 focus-within:border-sky-500/50 transition-all">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-slate-400 font-medium">วันที่:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleCopyReport}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-md ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
                  : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/20 hover:scale-[1.02]'
              }`}
            >
              {copied ? <Check className="w-4 h-4 animate-bounce" /> : <Copy className="w-4 h-4" />}
              {copied ? 'คัดลอกข้อความสรุปเรียบร้อย!' : 'คัดลอกข้อความสรุป'}
            </button>
          </div>
        </header>

        {/* Section ทีมบริหาร */}
        <section className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ทีมบริหารประจำกะ <span className="text-xs font-normal text-slate-400">({selectedShift === 'morning' ? 'กะเช้า' : 'กะดึก'})</span>
            </h2>
            
            <button
              onClick={() => setIsEditingLeaders(!isEditingLeaders)}
              className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                isEditingLeaders
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  : 'text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20'
              }`}
            >
              {isEditingLeaders ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกชื่อ</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขหัวหน้ากะ</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">TN.MC</span>
              {isEditingLeaders ? (
                <input
                  type="text"
                  value={tnMcName}
                  onChange={(e) => setTnMcName(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-lg p-1.5 text-sm text-amber-400 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              ) : (
                <p className="text-base font-bold text-amber-400">{tnMcName}</p>
              )}
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Support.TN</span>
              {isEditingLeaders ? (
                <input
                  type="text"
                  value={supportTnName}
                  onChange={(e) => setSupportTnName(e.target.value)}
                  className="w-full bg-slate-900 border border-sky-500/50 rounded-lg p-1.5 text-sm text-sky-400 font-semibold outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              ) : (
                <p className="text-base font-bold text-sky-400">{supportTnName}</p>
              )}
            </div>
          </div>
        </section>

        {/* Task List Section */}
        <section className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-400" /> 
              ตารางมอบหมายงาน
            </h2>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleRotateTasks}
                disabled={rotating || tasks.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-50 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                title="สลับเวรและเวลาของพนักงานอัตโนมัติ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`} />
                {rotating ? 'กำลังสลับ...' : 'สลับเวร'}
              </button>

              <button
                onClick={handleCloneYesterdayTasks}
                disabled={cloning}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 disabled:opacity-50 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                title="คัดลอกตารางงานของเมื่อวานมาใช้วันนี้"
              >
                <CopyPlus className="w-3.5 h-3.5" />
                {cloning ? 'กำลังคัดลอก...' : 'ดึงงานเมื่อวาน'}
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                {showAddForm ? <X className="w-3.5 h-3.5"/> : <Plus className="w-3.5 h-3.5"/>}
                {showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มรายการงาน'}
              </button>
            </div>
          </div>

          {/* Progress Bar (นับจำนวนงานที่เสร็จ) */}
          {totalTasksCount > 0 && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2 shadow-inner">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4 text-sky-400" />
                  ความคืบหน้างานประจำกะ:
                </span>
                <span className="font-mono text-sky-400 font-bold text-sm">
                  {completedTasksCount} / {totalTasksCount} รายการ ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              {progressPercent === 100 && (
                <p className="text-[11px] text-emerald-400 font-bold text-right pt-0.5 animate-pulse">
                  ✨ ทำงานครบถ้วนเรียบร้อยแล้วทุกรายการ!
                </p>
              )}
            </div>
          )}

          {/* ฟอร์มเพิ่มงาน */}
          {showAddForm && (
            <form onSubmit={handleAddTask} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-400">เพิ่มรายการงานประจำวัน ({selectedDate})</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">เวลาทำการ</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-sky-400 font-bold outline-none focus:border-sky-500"
                    required
                  >
                    {currentAvailableTimes.length === 0 ? (
                      <option value="">เวลาเต็มแล้ว</option>
                    ) : (
                      currentAvailableTimes.map(t => (
                        <option key={t} value={t}>{t} น.</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">ชื่อพนักงาน</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ใส่ชื่อพนักงาน"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-sky-500"
                      required
                    />
                    
                    {/* ปุ่มเลือก OT แบบ Badge Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsOt(!isOt)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                        isOt
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="กดเพื่อระบุ OT"
                    >
                      OT
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">ตำแหน่ง (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="MC">MC</option>
                    <option value="SL">SL</option>
                    <option value="TN.MC">TN.MC</option>
                    <option value="Support.TN">Support.TN</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs text-slate-400 font-medium">รายละเอียดงาน</label>
                  <input
                    type="text"
                    placeholder="เช่น ตามลูกค้า UFASLOT"
                    value={newActionDetail}
                    onChange={(e) => setNewActionDetail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={currentAvailableTimes.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md"
              >
                บันทึกรายการงาน
              </button>
            </form>
          )}

          {/* รายการ Tasks */}
          {loading ? (
            <div className="text-center py-12 space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
              <p className="text-xs text-slate-400 font-medium">กำลังโหลดข้อมูลตารางงาน...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 space-y-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
              <p className="text-slate-400 text-sm">ยังไม่มีรายการงานในวันที่ {selectedDate}</p>
              <button
                onClick={handleCloneYesterdayTasks}
                className="inline-flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <CopyPlus className="w-4 h-4" /> ดึงตารางงานจากเมื่อวานมาใช้
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all duration-200 gap-4 ${
                    task.is_completed 
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-500' 
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-100 shadow-md'
                  }`}
                >
                  {editingId === task.id ? (
                    /* โหมดแก้ไข */
                    <div className="flex-1 w-full space-y-3 bg-slate-950 p-3.5 rounded-xl border border-sky-500/30">
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 font-bold"
                        >
                          {(selectedShift === 'morning' ? MORNING_TIMES : NIGHT_TIMES)
                            .filter(t => t === task.time || !tasks.some(other => other.id !== task.id && other.time === t))
                            .map(t => (
                              <option key={t} value={t}>{t} น.</option>
                            ))}
                        </select>

                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-medium"
                        >
                          <option value="MC">MC</option>
                          <option value="SL">SL</option>
                          <option value="TN.MC">TN.MC</option>
                          <option value="Support.TN">Support.TN</option>
                        </select>

                        <input
                          type="text"
                          value={editStaffName}
                          onChange={(e) => setEditStaffName(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs flex-1 text-white"
                        />

                        {/* ปุ่มเลือก OT ในโหมดแก้ไข */}
                        <button
                          type="button"
                          onClick={() => setEditIsOt(!editIsOt)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border ${
                            editIsOt
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          OT
                        </button>
                      </div>

                      <input
                        type="text"
                        value={editActionDetail}
                        onChange={(e) => setEditActionDetail(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm w-full text-white"
                      />

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          className="flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                        >
                          <Save className="w-3 h-3"/> บันทึก
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs"
                        >
                          <X className="w-3 h-3"/> ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* โหมดปกติ */
                    <>
                      <div className="flex items-center gap-3.5 cursor-pointer flex-1" onClick={() => toggleTaskStatus(task.id, task.is_completed)}>
                        <button className="transition-transform active:scale-95">
                          {task.is_completed ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/80">
                              {task.time} น.
                            </span>
                            {task.is_completed && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                เสร็จสิ้น
                              </span>
                            )}
                          </div>
                          <p className={`font-medium text-sm sm:text-base ${task.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.action_detail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-800/60">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.role}: <strong className="text-white font-semibold">{task.staff_name}</strong></span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(task)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-lg transition-all"
                            title="แก้ไขเวลา/รายละเอียด"
                          >
                            <Edit3 className="w-4 h-4"/>
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id, task.staff_name)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-all"
                            title="ลบพนักงาน/งาน"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}