'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle2, Circle, Sun, Moon, User, Plus, Trash2, Edit3, Save, X, Calendar, Copy, Check, ShieldCheck, CopyPlus, RefreshCw, Sparkles, CheckCheck, Edit, FileText } from 'lucide-react';

interface TimeTaskPair {
  time: string;
  detail: string;
}

interface Task {
  id: string;
  time: string;
  additional_times?: string[]; // เก็บเวลาเพิ่มเติม
  time_details?: Record<string, string>; // เก็บรายละเอียดงานแยกตามเวลา { "20:00": "งาน A", "23:00": "งาน B" }
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

// รายการงานเริ่มต้นของ TN.MC และ Support.TN
const DEFAULT_MORNING_TN = [
  'ช่วย ดูแลไลน์ U-coin Rank [Diamond]',
  'ช่วยรับรายการเวลาไลน์แอดค้าง',
  'แนะนำแนวทางแก้ไขปัญหาต่างๆให้ MC.',
  'ตรวจสอบการตอบและทำรายการแก้ไขปัญหาให้ลูกค้า',
  'ตรวจสอบการตามลูกค้า ชาย / หญิง',
  'ตรวจสอบและอัปเดตแพทเทิร์นให้เป็นปัจจุบัน และ ตรงตามที่แผนก Quality Assurance กำหนด',
  'อัปเดตข้อความต้อนรับไลน์แอดให้ดูมีความน่าสนใจ',
  'เช็คและมอบหมายหน้าที่งานและกระจายงานให้กับ MC',
  'อัปเดตรูป ลิงก์ และแพทเทิร์น ข้อความทักทายเพื่อนใหม่ ให้ทันสมัย',
  'ติดต่อประสานงานกับส่วนกลางผ่านแอป U-Chat',
  'อัปเดตเบอร์โทรศัพท์หน้างาน MC',
  'Ag Balance ( ทุกๆ กะเข้าวันจันทร์ )',
  'ดูแลอัปเดตหน้า Membe / Pop up เพื่อให้หน้าเว็บดูน่าสนใจ',
  'มอบหมายหน้าที่งานประจำวันให้กับ MC',
  'ลงข้อมูล Report Google Group ตามที่ส่วนกลางกำหนด',
  'คอยอัปเดตรูปที่หน้างานจำเป็นที่ต้องใช้ และ บรีฟงานกับ Graphic เพื่อสั่งรูปใหม่',
  'ตรวจสอบกลุ่ม Telegram Graphic คอยดึงรูปโปรโมทต่างๆที่น่าสนใจออกมาเพื่อการตามลูกค้า',
  'เช็คสแปมไลน์แอดทั้งหมดที่ MC. ดูแล',
  'กำหนด Product ในการตามลูกค้าให้ทุกคนในทีม และ เวลาที่เหมาะสม',
  'อัปเดตกาดร์กีฬารายวัน ,และ โปรโมชั่นต่างๆ',
  'เช็ค OTP หน้าเว็บ',
  'ตรวจสอบการ CR ลูกค้าต่างๆ และการเปลี่ยนหัวให้เป็นไปตามนโยบายบริษัท',
  'เช็คไอพีสำหรับยูสเซอร์ New Member',
  'สรุปตาราง Dropbox Report',
  'ช่วยรับรายการเวลาไลน์แอดค้าง',
  'เเจ้ง TALK TALK\n @345 Customer Care / @MC345 SERVICEZ 345 / @ing345 ING345 / @วาร์ป'
];

const DEFAULT_MORNING_SUPPORT = [
  'รีพาส /อัปเดตลบ+เพิ่ม ข้อมูล',
  'Support TN.MC สรุปตาราง Dropbox Report',
  'เช็คสแปมไลน์แอดทั้งหมดที่ MC. ดูแล',
  'QA ตารางแนะนำเพื่อน',
  'เช็คกิจกรรมและโปรโมชั่นต่างๆ ที่มี พร้อมนำเสนอลูกค้า',
  'ตรวจสอบกลุ่ม Telegram Graphic คอยดึงรูปโปรโมทต่างๆที่น่าสนใจออกมาเพื่อการตามลูกค้า',
  'อัปเดตรูป ลิงก์ และแพทเทิร์น ข้อความทักทายเพื่อนใหม่ให้ทันสมัย และน่าสนใจ',
  'ดูและ Popup - Member ให้เป็นไปตามแพลนงานของบริษัท และได้รับการอนุมัติจาก TN.',
  'สนับสนุนงาน TN.MC ในทุกภารกิจที่ได้รับมอบหมาย ให้เป็นไปตามนโยบายของบริษัทและ South Group',
  'ดูแลรายการสมัครหน้าเว็บและดีด',
  'ตามลูกค้าไลน์หลักเมื่อวาน / ปัจจุบัน / ทีมตามMC (ชาย/หญิง)',
  'เก็บตกหล่น',
  'มอบหมายเปลี่ยนหัว CR ให้พนักงาน',
  'ดูแลและบริการการแก้ไขปัญหา แนะนำกิจกรรมให้ลูกค้า',
  'เปลี่ยนริชเมนูที่ไลน์ MC และ CALL ตอนเที่ยงคืน',
  '@UFA345V1  / @MC345 SERVICE / @ing345 ING345 / @วาร์ป'
];

const DEFAULT_NIGHT_TN = [
  'ช่วย ดูแลไลน์ U-coin Rank [Diamond]',
  'ช่วยรับรายการเวลาไลน์แอดค้าง',
  'แนะนำแนวทางแก้ไขปัญหาต่างๆให้ MC.',
  'ตรวจสอบการตอบและทำรายการแก้ไขปัญหาให้ลูกค้า',
  'ตรวจสอบการตามลูกค้า ชาย / หญิง',
  'ตรวจสอบและอัปเดตแพทเทิร์นให้เป็นปัจจุบัน และ ตรงตามที่แผนก Quality Assurance กำหนด',
  'อัปเดตข้อความต้อนรับไลน์แอดให้ดูมีความน่าสนใจ',
  'เช็คและมอบหมายหน้าที่งานและกระจายงานให้กับ MC',
  'อัปเดตรูป ลิงก์ และแพทเทิร์น ข้อความทักทายเพื่อนใหม่ ให้ทันสมัย',
  'ติดต่อประสานงานกับส่วนกลางผ่านแอป U-Chat',
  'อัปเดตเบอร์โทรศัพท์หน้างาน MC',
  'ดูแลอัปเดตหน้า Membe / Pop up เพื่อให้หน้าเว็บดูน่าสนใจ',
  'มอบหมายหน้าที่งานประจำวันให้กับ MC',
  'ลงข้อมูล Report Google Group ตามที่ส่วนกลางกำหนด',
  'คอยอัปเดตรูปที่หน้างานจำเป็นที่ต้องใช้ และ บรีฟงานกับ Graphic เพื่อสั่งรูปใหม่',
  'ตรวจสอบกลุ่ม Telegram Graphic คอยดึงรูปโปรโมทต่างๆที่น่าสนใจออกมาเพื่อการตามลูกค้า',
  'เช็คสแปมไลน์แอดทั้งหมดที่ MC. ดูแล',
  'กำหนด Product ในการตามลูกค้าให้ทุกคนในทีม และ เวลาที่เหมาะสม',
  'อัปเดตกาดร์กีฬารายวัน ,และ โปรโมชั่นต่างๆ',
  'เช็ค OTP หน้าเว็บ',
  'ตรวจสอบการ CR ลูกค้าต่างๆ และการเปลี่ยนหัวให้เป็นไปตามนโยบายบริษัท',
  'เช็คไอพีสำหรับยูสเซอร์ New Member',
  'สรุปตาราง Dropbox Report',
  'ช่วยรับรายการเวลาไลน์แอดค้าง',
  'เเจ้ง TALK TALK\n @345 Customer Care / @MC345 SERVICEZ 345 / @ing345 ING345 / @วาร์ป'
];

const DEFAULT_NIGHT_SUPPORT = [
  'รีพาส /อัปเดตลบ+เพิ่ม ข้อมูล',
  'Support TN.MC สรุปตาราง Dropbox Report',
  'เช็คสแปมไลน์แอดทั้งหมดที่ MC. ดูแล',
  'QA ตารางแนะนำเพื่อน',
  'เช็คกิจกรรมและโปรโมชั่นต่างๆ ที่มี พร้อมนำเสนอลูกค้า',
  'ตรวจสอบกลุ่ม Telegram Graphic คอยดึงรูปโปรโมทต่างๆที่น่าสนใจออกมาเพื่อการตามลูกค้า',
  'อัปเดตรูป ลิงก์ และแพทเทิร์น ข้อความทักทายเพื่อนใหม่ให้ทันสมัย และน่าสนใจ',
  'ดูและ Popup - Member ให้เป็นไปตามแพลนงานของบริษัท และได้รับการอนุมัติจาก TN.',
  'สนับสนุนงาน TN.MC ในทุกภารกิจที่ได้รับมอบหมาย ให้เป็นไปตามนโยบายของบริษัทและ South Group',
  'ดูแลรายการสมัครหน้าเว็บและดีด',
  'เก็บตกหล่น',
  'มอบหมายเปลี่ยนหัว CR ให้พนักงาน',
  'ดูแลและบริการการแก้ไขปัญหา แนะนำกิจกรรมให้ลูกค้า',
  'เปลี่ยนริชเมนูที่ไลน์ MC และ CALL ตอนเที่ยงคืน',
  'สรุปตาราง Dropbox Report',
  '@UFA345V1  / @MC345 SERVICE / @ing345 ING345 / @วาร์ป'
];

// คำนวณช่วงวันที่ย้อนหลัง 7 วัน
const getTodayString = () => new Date().toISOString().split('T')[0];

const getMinDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
};

const getRecent7Days = () => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      displayDate: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      label: i === 0 ? 'วันนี้' : i === 1 ? 'เมื่อวาน' : `${i} วันที่แล้ว`
    });
  }
  return days;
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<'morning' | 'night'>('morning');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const [tnMcName, setTnMcName] = useState('เอก [Z3]');
  const [supportTnName, setSupportTnName] = useState('พี่เอ้ [SL]');
  const [isEditingLeaders, setIsEditingLeaders] = useState(false);

  // สเตทสำหรับเก็บรายการงานประจำของหัวหน้ากะ
  const [morningTnTasks, setMorningTnTasks] = useState<string[]>(DEFAULT_MORNING_TN);
  const [morningSupportTasks, setMorningSupportTasks] = useState<string[]>(DEFAULT_MORNING_SUPPORT);
  const [nightTnTasks, setNightTnTasks] = useState<string[]>(DEFAULT_NIGHT_TN);
  const [nightSupportTasks, setNightSupportTasks] = useState<string[]>(DEFAULT_NIGHT_SUPPORT);

  // สเตทเปิด/ปิด Pop-up แก้ไขรายละเอียดงานหัวหน้า
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<'tn' | 'support'>('tn');
  const [tempTasksInput, setTempTasksInput] = useState<string>('');

  // คำนวณจำนวนงานที่เสร็จและเปอร์เซ็นต์
  const completedTasksCount = tasks.filter(t => t.is_completed).length;
  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const todayStr = getTodayString();
  const minDateStr = getMinDateString();
  const recentDays = getRecent7Days();

  // ระบบดึงวันที่และเวลาปัจจุบันแบบ Realtime
  useEffect(() => {
    const updateRealtimeDateAndShift = () => {
      const now = new Date();
      const currentDateString = now.toISOString().split('T')[0];

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

  // สเตทเพิ่มงานแบบจับคู่ [เวลา, รายละเอียดงาน]
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTimePairs, setNewTimePairs] = useState<TimeTaskPair[]>([{ time: '', detail: '' }]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newRole, setNewRole] = useState('MC');
  const [isOt, setIsOt] = useState(false);

  // สเตทแก้ไขงาน
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTimePairs, setEditTimePairs] = useState<TimeTaskPair[]>([]);
  const [editStaffName, setEditStaffName] = useState('');
  const [editRole, setEditRole] = useState('MC');
  const [editIsOt, setEditIsOt] = useState(false);

  const shiftTimes = selectedShift === 'morning' ? MORNING_TIMES : NIGHT_TIMES;

  useEffect(() => {
    if (selectedDate) {
      if (selectedDate < minDateStr) {
        alert('สามารถดูข้อมูลย้อนหลังได้สูงสุด 7 วันเท่านั้นครับ');
        setSelectedDate(minDateStr);
        return;
      }
      if (selectedDate > todayStr) {
        setSelectedDate(todayStr);
        return;
      }
      fetchTasks();
    }
  }, [selectedShift, selectedDate]);

  useEffect(() => {
    if (shiftTimes.length > 0) {
      setNewTimePairs([{ time: shiftTimes[0], detail: '' }]);
    }
  }, [selectedShift]);

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
      additional_times: t.additional_times || [],
      time_details: t.time_details || {},
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
    if (!newTimePairs[0]?.time) {
      alert('กรุณาเลือกเวลาทำการด้วยครับ');
      return;
    }
    if (!newStaffName.trim()) return;

    const mainTime = newTimePairs[0].time;
    const additionalTimes = newTimePairs.slice(1).map(p => p.time).filter(Boolean);
    
    // สร้าง Object แมปเวลากับรายละเอียดงาน
    const timeDetailsObj: Record<string, string> = {};
    newTimePairs.forEach(p => {
      if (p.time) {
        timeDetailsObj[p.time] = p.detail || '';
      }
    });

    const primaryDetail = newTimePairs[0].detail || 'ตามลูกค้า';

    const finalStaffName = isOt && !newStaffName.trim().endsWith('OT') 
      ? `${newStaffName.trim()} OT` 
      : newStaffName.trim();

    const newTask = {
      time: mainTime,
      additional_times: additionalTimes,
      time_details: timeDetailsObj,
      staff_name: finalStaffName,
      role: newRole,
      action_detail: primaryDetail,
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
      setNewTimePairs([{ time: shiftTimes[0] || '20:00', detail: '' }]);
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
    
    // แปลงข้อมูล Task เป็นชุด [เวลา, รายละเอียดงาน]
    const allTimes = [task.time, ...(task.additional_times || [])];
    const pairs: TimeTaskPair[] = allTimes.map(t => ({
      time: t,
      detail: task.time_details?.[t] || (t === task.time ? task.action_detail : '')
    }));

    setEditTimePairs(pairs);
    const hasOt = task.staff_name.endsWith(' OT');
    setEditStaffName(hasOt ? task.staff_name.replace(/ OT$/, '') : task.staff_name);
    setEditIsOt(hasOt);
    setEditRole(task.role);
  };

  const handleSaveEdit = async (id: string) => {
    const mainTime = editTimePairs[0]?.time || '00:00';
    const additionalTimes = editTimePairs.slice(1).map(p => p.time).filter(Boolean);
    
    const timeDetailsObj: Record<string, string> = {};
    editTimePairs.forEach(p => {
      if (p.time) {
        timeDetailsObj[p.time] = p.detail || '';
      }
    });

    const primaryDetail = editTimePairs[0]?.detail || 'ตามลูกค้า';

    const finalStaffName = editIsOt && !editStaffName.trim().endsWith('OT')
      ? `${editStaffName.trim()} OT`
      : editStaffName.trim();

    const { error } = await supabase
      .from('daily_tasks')
      .update({
        time: mainTime,
        additional_times: additionalTimes,
        time_details: timeDetailsObj,
        staff_name: finalStaffName,
        role: editRole,
        action_detail: primaryDetail
      })
      .eq('id', id);

    if (!error) {
      const updatedList = tasks.map(t => 
        t.id === id 
          ? { 
              ...t, 
              time: mainTime, 
              additional_times: additionalTimes, 
              time_details: timeDetailsObj,
              staff_name: finalStaffName, 
              role: editRole, 
              action_detail: primaryDetail 
            } 
          : t
      );
      setTasks(updatedList.sort((a, b) => a.time.localeCompare(b.time)));
      setEditingId(null);
    }
  };

  // เปิด Modal แก้ไขรายละเอียดงานหัวหน้า
  const openLeaderTasksModal = (target: 'tn' | 'support') => {
    setEditingTarget(target);
    let targetTasks: string[] = [];
    if (selectedShift === 'morning') {
      targetTasks = target === 'tn' ? morningTnTasks : morningSupportTasks;
    } else {
      targetTasks = target === 'tn' ? nightTnTasks : nightSupportTasks;
    }
    setTempTasksInput(targetTasks.join('\n'));
    setShowTaskDetailModal(true);
  };

  // บันทึกรายการงานหัวหน้า
  const saveLeaderTasks = () => {
    const updatedArray = tempTasksInput
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (selectedShift === 'morning') {
      if (editingTarget === 'tn') setMorningTnTasks(updatedArray);
      else setMorningSupportTasks(updatedArray);
    } else {
      if (editingTarget === 'tn') setNightTnTasks(updatedArray);
      else setNightSupportTasks(updatedArray);
    }

    setShowTaskDetailModal(false);
  };

  const handleCopyReport = () => {
    const formattedDate = selectedDate.split('-').reverse().join(' / ');
    const shiftTitle = selectedShift === 'morning' ? 'MC  กะเช้า' : 'MC ดึก';

    let reportText = `หน้าที่ประจำวันที่ ${formattedDate}\n\n${shiftTitle}\n\n`;

    const currentTnTasks = selectedShift === 'morning' ? morningTnTasks : nightTnTasks;
    const currentSupportTasks = selectedShift === 'morning' ? morningSupportTasks : nightSupportTasks;

    reportText += `TN.MC : ${tnMcName}\n`;
    currentTnTasks.forEach(task => {
      reportText += `- ${task}\n`;
    });

    reportText += `\nSupport.TN ${supportTnName}\n`;
    currentSupportTasks.forEach(task => {
      reportText += `- ${task}\n`;
    });

    reportText += `\n📍 หลักการตามลูกค้า 🚩 แยกชาย-หญิง และหากมีโน๊ต ประเภทที่ลค.สนใจ\nING, ไลน์หลัก   =  วันนี้ + เมื่อวาน และ แท็กทีมตามMC   \n------------------------------------\n\n🚩หน้าที่หลักของ พนง. MC ที่ต้องช่วยกัน !!\n\n- 5 LINE@ หลักที่ต้องดูแลช่วยกัน [345สมัคร, ไลน์หลัก, ING, SERVICE และ ทำไมไม่วาร์ป]\n-  ตามแจ้งเคสถอนใน Talk Talk 📌\n-  รับ+ดีด รายการหน้าเว็บ\n-  เก็บตกหล่น\n\nนอกเหนือจากนี้ มีการแบ่งหน้าที่ให้ชัดเจนแล้ว ตามนี้ค่ะ\n\n`;

    const formattedTaskList = tasks.map(task => {
      const allTimes = [task.time, ...(task.additional_times || [])];
      
      // จัดรูปแบบแยกเวลาตามด้วยรายละเอียดงาน
      const timeLines = allTimes.map(t => {
        const detail = task.time_details?.[t] || task.action_detail || '';
        return `- 🕘 ${t} น. ${detail}`.trim();
      }).join('\n');

      return `- ${task.role} : ${task.staff_name}\n${timeLines}\n🕰 เก็บตกหล่น`;
    }).join('\n\n');

    reportText += formattedTaskList;

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

          {/* แถบเลือกวันที่ย้อนหลัง ( Quick Tabs 7 วัน ) */}
          <div className="pt-2 border-t border-slate-800/80 relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                เลือกดูข้อมูลย้อนหลัง (สูงสุด 7 วัน):
              </span>
              <span className="text-[11px] text-slate-500">
                {minDateStr.split('-').reverse().join('/')} - {todayStr.split('-').reverse().join('/')}
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {recentDays.map((day) => {
                const isActive = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-xl text-center transition-all border flex flex-col items-center justify-center ${
                      isActive
                        ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 font-bold shadow-lg shadow-sky-500/10'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-[10px] font-medium opacity-80">{day.label}</span>
                    <span className="text-xs font-mono font-bold">{day.displayDate}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 relative z-10">
            <div className="flex items-center gap-2.5 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800 focus-within:border-sky-500/50 transition-all">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-slate-400 font-medium">ระบุวันที่:</span>
              <input
                type="date"
                min={minDateStr}
                max={todayStr}
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
          <div className="flex flex-wrap justify-between items-center border-b border-slate-800/80 pb-3 gap-2">
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
                  <span>แก้ไขชื่อหัวหน้ากะ</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* TN.MC Box */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">TN.MC</span>
                <button
                  onClick={() => openLeaderTasksModal('tn')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 transition-all"
                >
                  <Edit className="w-3 h-3" /> แก้ไขงานประจำ
                </button>
              </div>

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

              {/* แสดงตัวอย่างงาน TN.MC */}
              <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded-lg max-h-24 overflow-y-auto space-y-1 scrollbar-thin">
                {(selectedShift === 'morning' ? morningTnTasks : nightTnTasks).map((task, idx) => (
                  <p key={idx} className="truncate">• {task}</p>
                ))}
              </div>
            </div>

            {/* Support.TN Box */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Support.TN</span>
                <button
                  onClick={() => openLeaderTasksModal('support')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 transition-all"
                >
                  <Edit className="w-3 h-3" /> แก้ไขงานประจำ
                </button>
              </div>

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

              {/* แสดงตัวอย่างงาน Support.TN */}
              <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded-lg max-h-24 overflow-y-auto space-y-1 scrollbar-thin">
                {(selectedShift === 'morning' ? morningSupportTasks : nightSupportTasks).map((task, idx) => (
                  <p key={idx} className="truncate">• {task}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Modal สำหรับแก้ไขรายละเอียดงานหัวหน้า */}
        {showTaskDetailModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  จัดการงานประจำของ {editingTarget === 'tn' ? 'TN.MC' : 'Support.TN'} ({selectedShift === 'morning' ? 'กะเช้า' : 'กะดึก'})
                </h3>
                <button 
                  onClick={() => setShowTaskDetailModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">
                  แก้ไขข้อความบทบาทงานประจำ (1 บรรทัด = 1 หัวข้อ/รายการ):
                </label>
                <textarea
                  value={tempTasksInput}
                  onChange={(e) => setTempTasksInput(e.target.value)}
                  rows={12}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 leading-relaxed scrollbar-thin"
                  placeholder="พิมพ์รายการงานที่นี่..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowTaskDetailModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={saveLeaderTasks}
                  className="px-4 py-2 rounded-xl text-xs text-slate-950 font-bold bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-3.5 h-3.5" /> บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          </div>
        )}

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

              {/* ส่วนกรอกข้อมูลหลัก: ชื่อพนักงาน + ตำแหน่ง */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-sky-500 font-medium cursor-pointer"
                  >
                    <option value="MC">MC</option>
                    <option value="SL">SL</option>
                    <option value="TN.MC">TN.MC</option>
                    <option value="Support.TN">Support.TN</option>
                  </select>
                </div>
              </div>

              {/* ส่วนเพิ่มเวลา + รายละเอียดงานแต่ละช่วงเวลา (สูงสุด 3 ช่วง) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-sky-400">เวลาตามลูกค้า และ รายละเอียดงานประจำช่วงเวลา (สูงสุด 3 เวลา):</label>
                  {newTimePairs.length < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const unusedTime = shiftTimes.find(t => !newTimePairs.some(p => p.time === t)) || shiftTimes[0];
                        setNewTimePairs([...newTimePairs, { time: unusedTime, detail: '' }]);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/50 border border-emerald-800 px-2.5 py-1 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มเวลาตามลูกค้า
                    </button>
                  )}
                </div>

                {newTimePairs.map((pair, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-12">เวลา #{idx + 1}:</span>
                      <select
                        value={pair.time}
                        onChange={(e) => {
                          const updated = [...newTimePairs];
                          updated[idx].time = e.target.value;
                          setNewTimePairs(updated);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-bold text-sky-400 outline-none cursor-pointer"
                        required
                      >
                        {shiftTimes.map(t => (
                          <option key={t} value={t}>{t} น.</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder={`รายละเอียดงานช่วง ${pair.time || ''} น. (เช่น ตามลูกค้า UFASLOT)`}
                      value={pair.detail}
                      onChange={(e) => {
                        const updated = [...newTimePairs];
                        updated[idx].detail = e.target.value;
                        setNewTimePairs(updated);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none focus:border-sky-500"
                      required
                    />

                    {newTimePairs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewTimePairs(newTimePairs.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-400 p-2 self-end sm:self-center"
                        title="ลบเวลานี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md mt-2"
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
                    /* โหมดแก้ไขรายการงาน */
                    <div className="flex-1 w-full space-y-3 bg-slate-950 p-3.5 rounded-xl border border-sky-500/30">
                      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-medium cursor-pointer"
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
                          className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs flex-1 text-white outline-none"
                          placeholder="ชื่อพนักงาน"
                        />

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

                      {/* รายการเวลา + รายละเอียดในโหมดแก้ไข */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-sky-400">แก้ไขเวลาและรายละเอียดงาน:</span>
                          {editTimePairs.length < 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                const unusedTime = shiftTimes.find(t => !editTimePairs.some(p => p.time === t)) || shiftTimes[0];
                                setEditTimePairs([...editTimePairs, { time: unusedTime, detail: '' }]);
                              }}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded"
                            >
                              <Plus className="w-3 h-3" /> เพิ่มเวลา
                            </button>
                          )}
                        </div>

                        {editTimePairs.map((pair, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                            <select
                              value={pair.time}
                              onChange={(e) => {
                                const updated = [...editTimePairs];
                                updated[idx].time = e.target.value;
                                setEditTimePairs(updated);
                              }}
                              className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-sky-400 outline-none cursor-pointer"
                            >
                              {shiftTimes.map(st => (
                                <option key={st} value={st}>{st} น.</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={pair.detail}
                              onChange={(e) => {
                                const updated = [...editTimePairs];
                                updated[idx].detail = e.target.value;
                                setEditTimePairs(updated);
                              }}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white outline-none"
                              placeholder="รายละเอียดงานช่วงเวลานี้"
                            />

                            {editTimePairs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setEditTimePairs(editTimePairs.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-400 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          className="flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md"
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
                    /* โหมดแสดงผลปกติ */
                    <>
                      <div className="flex items-start gap-3.5 cursor-pointer flex-1" onClick={() => toggleTaskStatus(task.id, task.is_completed)}>
                        <button className="transition-transform active:scale-95 mt-1">
                          {task.is_completed ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>

                        <div className="space-y-2 flex-1">
                          {/* แสดงรายการเวลา + รายละเอียดงานแต่ละช่วง */}
                          {[task.time, ...(task.additional_times || [])].map((t, idx) => {
                            const detail = task.time_details?.[t] || (t === task.time ? task.action_detail : '');
                            return (
                              <div key={idx} className="flex flex-wrap items-center gap-2">
                                <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/80">
                                  {t} น.
                                </span>
                                <span className={`text-sm font-medium ${task.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                  {detail}
                                </span>
                              </div>
                            );
                          })}

                          {task.is_completed && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              เสร็จสิ้น
                            </span>
                          )}
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