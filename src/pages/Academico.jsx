import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
    BookOpen, Save, MessageCircle, FileText, ChevronRight, GraduationCap, Calendar, User
} from 'lucide-react';

const Academico = () => {
    const { employees, config, academicRecords, guardarNota, isLoading, showToast } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [activeTab, setActiveTab] = useState('registro');

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Estados para las notas
    const [notasSemanal, setNotasSemanal] = useState({ n1: '', n2: '', n3: '', n4: '' });
    const [notasSimulacro, setNotasSimulacro] = useState({ s1: '', s2: '', s3: '', s4: '' });

    const handleLoadNotes = () => {
        if (!selectedEmployee || !selectedMonth) return;
        
        // Buscamos el registro único para este alumno y mes
        const record = academicRecords.find(r => 
            String(r.ID_Alumno) === String(selectedEmployee) && 
            r.Mes === selectedMonth
        );

        // Actualizamos los estados con los valores encontrados (S1-S4 y Sim1-Sim4)
        setNotasSemanal({
            n1: record?.S1 || '',
            n2: record?.S2 || '',
            n3: record?.S3 || '',
            n4: record?.S4 || ''
        });

        setNotasSimulacro({
            s1: record?.Sim1 || '',
            s2: record?.Sim2 || '',
            s3: record?.Sim3 || '',
            s4: record?.Sim4 || ''
        });
    };

    // Cargar notas automáticamente cuando cambie alumno o mes
    React.useEffect(() => {
        handleLoadNotes();
    }, [selectedEmployee, selectedMonth, academicRecords]);



    const handleSaveAll = async () => {
        if (!selectedEmployee) return;

        try {
            // Buscamos si ya existe el registro localmente para obtener su ID
            const recordExistente = academicRecords.find(r => 
                String(r.ID_Alumno) === String(selectedEmployee) && 
                r.Mes === selectedMonth
            );

            // Unificamos todas las notas en un solo objeto para una sola fila
            const dataUnificada = {
                ID: recordExistente?.ID || '', // IMPORTANTE: Enviamos el ID si existe para "chancar"
                ID_Alumno: selectedEmployee,
                Mes: selectedMonth,
                S1: notasSemanal.n1 || '',
                S2: notasSemanal.n2 || '',
                S3: notasSemanal.n3 || '',
                S4: notasSemanal.n4 || '',
                Sim1: notasSimulacro.s1 || '',
                Sim2: notasSimulacro.s2 || '',
                Sim3: notasSimulacro.s3 || '',
                Sim4: notasSimulacro.s4 || ''
            };

            const res = await guardarNota(dataUnificada);

            if (res.success) {
                showToast(`Reporte de ${meses[parseInt(selectedMonth.split('-')[1]) - 1]} guardado correctamente`, 'success');
            } else {
                showToast("Hubo un error al guardar el reporte", "error");
            }
        } catch (error) {
            console.error("Error al guardar el reporte:", error);
            showToast("Error crítico al guardar. Revisa la consola.", "error");
        }
    };

    const handleWhatsAppSend = () => {
        const employee = employees.find(e => e.id === selectedEmployee);
        if (!employee || !employee.telefono) return;

        const [year, month] = selectedMonth.split('-');
        const mesNombre = meses[parseInt(month) - 1];

        const i = {
            school: String.fromCodePoint(0x1F3EB),
            hello: String.fromCodePoint(0x1F44B),
            user: String.fromCodePoint(0x1F464),
            calendar: String.fromCodePoint(0x1F4C5),
            book: String.fromCodePoint(0x1F4D3),
            cap: String.fromCodePoint(0x1F393),
            chart: String.fromCodePoint(0x1F4CA)
        };

        const formatNota = (n) => n === '' ? '--' : n;

        const msg = 
`*${i.school} ${(config?.nombreEntidad || 'SISTEMA').toUpperCase()}*
*REPORTE DE RENDIMIENTO ACADÉMICO*

¡Hola! ${i.hello} Buenos días.
Le informamos el progreso académico de:
${i.user} *${employee.nombre} ${employee.apellido}*
${i.calendar} Mes: *${mesNombre} ${year}*

━━━━━━━━━━━━━━━━━━━━
${i.book} *EXÁMENES SEMANALES*
━━━━━━━━━━━━━━━━━━━━
Semana 1:  *${formatNota(notasSemanal.n1)}*
Semana 2:  *${formatNota(notasSemanal.n2)}*
Semana 3:  *${formatNota(notasSemanal.n3)}*
Semana 4:  *${formatNota(notasSemanal.n4)}*

━━━━━━━━━━━━━━━━━━━━
${i.cap} *SIMULACROS*
━━━━━━━━━━━━━━━━━━━━
Semana 1:  *${formatNota(notasSimulacro.s1)}*
Semana 2:  *${formatNota(notasSimulacro.s2)}*
Semana 3:  *${formatNota(notasSimulacro.s3)}*
Semana 4:  *${formatNota(notasSimulacro.s4)}*

━━━━━━━━━━━━━━━━━━━━
${i.chart} _Nota: El símbolo '--' indica que el alumno no rindió el examen correspondiente._`.trim();

        const phone = String(employee.telefono).replace(/\D/g, '');
        const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Rendimiento Académico</h2>
                    <p className="text-gray-600">Gestión de notas semanales y simulacros</p>
                </div>
            </div>

            {/* Panel de Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Alumno</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        >
                            <option value="">Elegir alumno...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.nombre} {emp.apellido}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mes del Reporte</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {selectedEmployee ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex gap-4 mb-6">
                        <button 
                            onClick={() => setActiveTab('registro')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'registro' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100'}`}
                        >
                            <FileText className="w-5 h-5" />
                            Registro de Notas
                        </button>
                        <button 
                            onClick={() => setActiveTab('reporte')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'reporte' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100'}`}
                        >
                            <MessageCircle className="w-5 h-5" />
                            Vista Previa y WhatsApp
                        </button>
                    </div>

                    {activeTab === 'registro' ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Tarjeta Semanales */}
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                    <div className="bg-blue-50 p-6 border-b border-blue-100 flex items-center gap-3">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                        <h3 className="text-xl font-bold text-blue-900">Exámenes Semanales</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {[1, 2, 3, 4].map(n => (
                                                <div key={n}>
                                                    <label className="block text-xs font-bold text-gray-400 mb-1">Semana {n}</label>
                                                    <input 
                                                        type="number"
                                                        value={notasSemanal[`n${n}`]}
                                                        onChange={(e) => setNotasSemanal({...notasSemanal, [`n${n}`]: e.target.value})}
                                                        placeholder="--"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </div>

                                {/* Tarjeta Simulacros */}
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                    <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex items-center gap-3">
                                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                                        <h3 className="text-xl font-bold text-indigo-900">Simulacros de Examen</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {[1, 2, 3, 4].map(n => (
                                                <div key={n}>
                                                    <label className="block text-xs font-bold text-gray-400 mb-1">Fase {n}</label>
                                                    <input 
                                                        type="number"
                                                        value={notasSimulacro[`s${n}`]}
                                                        onChange={(e) => setNotasSimulacro({...notasSimulacro, [`s${n}`]: e.target.value})}
                                                        placeholder="--"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* BOTÓN ÚNICO DE GUARDADO */}
                            <div className="flex justify-center">
                                <button 
                                    onClick={handleSaveAll}
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Save className="w-6 h-6" />
                                    )}
                                    Guardar Registro Mensual
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-2xl mx-auto">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Enviar Reporte a WhatsApp</h3>
                                <p className="text-gray-500 mt-2">Se enviará un resumen con todas las notas guardadas del mes de {meses[parseInt(selectedMonth.split('-')[1]) - 1]}</p>
                            </div>

                            <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Estado del Reporte</span>
                                    <span className="font-bold text-blue-600">Completo</span>
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-xs text-center text-gray-400 italic">"Las notas en blanco se enviarán como un guion '--'"</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleWhatsAppSend}
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-100 transition-all active:scale-95"
                            >
                                <MessageCircle className="w-6 h-6" />
                                Enviar Reporte Académico
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-16 text-center">
                    <div className="mb-4 flex justify-center">
                        <User className="w-12 h-12 text-blue-200" />
                    </div>
                    <p className="text-blue-700 font-medium text-lg">Por favor, selecciona un alumno para gestionar sus notas</p>
                </div>
            )}
        </div>
    );
};

export default Academico;
