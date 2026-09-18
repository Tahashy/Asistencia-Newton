import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    BookOpen, Save, MessageCircle, FileText, GraduationCap, User, Trophy, Download, MapPin, Search, X, Filter, Briefcase, Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Academico = () => {
    const { employees, config, academicRecords, guardarNota, isLoading, showToast } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [activeTab, setActiveTab] = useState('registro');

    // Estados para búsqueda y filtros de alumnos
    const [personSearch, setPersonSearch] = useState('');
    const [comboOpen, setComboOpen] = useState(false);
    const [filterSede, setFilterSede] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterTurno, setFilterTurno] = useState('');

    const filteredForCombo = employees.filter(emp => {
        const q = personSearch.toLowerCase();
        const matchSearch = !q ||
            (emp.nombre || '').toLowerCase().includes(q) ||
            (emp.apellido || '').toLowerCase().includes(q) ||
            (emp.id || '').toLowerCase().includes(q);
        const matchSede = !filterSede || emp.sede === filterSede;
        const matchArea = !filterArea || emp.area === filterArea;
        const matchTurno = !filterTurno || emp.turno === filterTurno;
        return matchSearch && matchSede && matchArea && matchTurno;
    });

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

    // ── RANKING POR SEDE ────────────────────────────────────────
    const [rankingTipo, setRankingTipo] = useState('semanal');
    const [rankingSemana, setRankingSemana] = useState('1');
    const [rankingMes, setRankingMes] = useState(new Date().toISOString().slice(0, 7));
    const [rankingSede, setRankingSede] = useState('');
    const [rankingArea, setRankingArea] = useState('');

    const buildRanking = () => {
        const campo = rankingTipo === 'semanal' ? `S${rankingSemana}` : `Sim${rankingSemana}`;
        const resultado = {};
        employees.filter(e => e.activo && (!rankingSede || e.sede === rankingSede) && (!rankingArea || e.area === rankingArea)).forEach(emp => {
            const record = academicRecords.find(r =>
                String(r.ID_Alumno) === String(emp.id) && r.Mes === rankingMes
            );
            const raw = record ? parseFloat(record[campo]) : null;
            const puntaje = raw !== null && !isNaN(raw) ? raw : null;
            const sede = emp.sede || 'Sin Sede';
            if (!resultado[sede]) resultado[sede] = [];
            resultado[sede].push({ nombre: `${emp.nombre} ${emp.apellido}`, puntaje });
        });
        Object.keys(resultado).forEach(sede => {
            resultado[sede].sort((a, b) => {
                if (a.puntaje === null && b.puntaje === null) return 0;
                if (a.puntaje === null) return 1;
                if (b.puntaje === null) return -1;
                return b.puntaje - a.puntaje;
            });
        });
        return resultado;
    };

    const rankingData = buildRanking();
    const sedesConDatos = Object.keys(rankingData).sort();

    const medalColor = (pos) => {
        if (pos === 0) return 'text-yellow-500';
        if (pos === 1) return 'text-gray-400';
        if (pos === 2) return 'text-amber-600';
        return 'text-gray-300';
    };

    const handleGenerarPDF = () => {
        const doc = new jsPDF();
        const mesesNombre = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const [year, month] = rankingMes.split('-');
        const mesNombre = mesesNombre[parseInt(month) - 1];
        const tipoLabel = rankingTipo === 'semanal' ? `Semana ${rankingSemana}` : `Simulacro ${rankingSemana}`;
        const institucion = config?.nombreEntidad || 'Sistema';

        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(institucion.toUpperCase(), 105, 12, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        let subtitle = `Ranking Académico — ${tipoLabel} · ${mesNombre} ${year}`;
        if (rankingArea) subtitle += ` · Área: ${rankingArea}`;
        doc.text(subtitle, 105, 22, { align: 'center' });

        let currentY = 38;
        sedesConDatos.forEach(sede => {
            const alumnos = rankingData[sede];
            if (currentY > 250) { doc.addPage(); currentY = 15; }
            doc.setFillColor(239, 246, 255);
            doc.setDrawColor(147, 197, 253);
            doc.roundedRect(10, currentY - 5, 190, 10, 2, 2, 'FD');
            doc.setTextColor(37, 99, 235);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`Sede: ${sede}`, 15, currentY + 2);
            currentY += 10;
            const rows = alumnos.map((a, i) => [i + 1, a.nombre, a.puntaje !== null ? a.puntaje : '--']);
            autoTable(doc, {
                startY: currentY,
                head: [['#', 'Alumno', 'Puntaje']],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
                },
                margin: { left: 10, right: 10 },
                styles: { fontSize: 9 }
            });
            currentY = doc.lastAutoTable.finalY + 10;
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Generado por ${institucion} · Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
        }
        doc.save(`Ranking_${tipoLabel.replace(' ', '_')}_${rankingMes}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Rendimiento Académico</h2>
                    <p className="text-gray-600">Gestión de notas semanales y simulacros</p>
                </div>
            </div>

            {/* Tabs principales */}
            <div className="flex gap-3">
                <button
                    onClick={() => setActiveTab('registro')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'registro' || activeTab === 'reporte' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100'}`}
                >
                    <FileText className="w-5 h-5" />
                    Registro de Notas
                </button>
                <button
                    onClick={() => setActiveTab('ranking')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ranking' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-600 border border-gray-100'}`}
                >
                    <Trophy className="w-5 h-5" />
                    Ranking por Sede
                </button>
            </div>

            {activeTab === 'ranking' ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sede</label>
                                <select
                                    value={rankingSede}
                                    onChange={(e) => setRankingSede(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none bg-white transition-all"
                                >
                                    <option value="">Todas las Sedes</option>
                                    {config?.sedes?.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Área</label>
                                <select
                                    value={rankingArea}
                                    onChange={(e) => setRankingArea(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none bg-white transition-all"
                                >
                                    <option value="">Todas las Áreas</option>
                                    {config?.areas?.map((a, i) => <option key={i} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mes</label>
                                <input
                                    type="month"
                                    value={rankingMes}
                                    onChange={(e) => setRankingMes(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Examen</label>
                                <select
                                    value={rankingTipo}
                                    onChange={(e) => setRankingTipo(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none bg-white transition-all"
                                >
                                    <option value="semanal">Examen Semanal</option>
                                    <option value="simulacro">Simulacro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                    {rankingTipo === 'semanal' ? 'Semana' : 'Fase'}
                                </label>
                                <select
                                    value={rankingSemana}
                                    onChange={(e) => setRankingSemana(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none bg-white transition-all"
                                >
                                    {[1, 2, 3, 4].map(n => (
                                        <option key={n} value={String(n)}>
                                            {rankingTipo === 'semanal' ? `Semana ${n}` : `Fase ${n}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleGenerarPDF}
                                disabled={sedesConDatos.length === 0}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-200 active:scale-95 disabled:opacity-40"
                            >
                                <Download className="w-5 h-5" />
                                Generar PDF
                            </button>
                        </div>
                    </div>

                    {sedesConDatos.length === 0 ? (
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-12 text-center">
                            <Trophy className="w-12 h-12 text-purple-200 mx-auto mb-3" />
                            <p className="text-purple-600 font-medium">No hay alumnos activos registrados</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {sedesConDatos.map(sede => (
                                <div key={sede} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-white/80" />
                                        <h3 className="font-bold text-white text-lg">{sede}</h3>
                                        <span className="ml-auto bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            {rankingData[sede].length} alumnos
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {rankingData[sede].map((alumno, idx) => (
                                            <div key={idx} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                                                <span className={`w-7 h-7 flex items-center justify-center font-black text-sm rounded-full ${
                                                    idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                                                    idx === 1 ? 'bg-gray-100 text-gray-500' :
                                                    idx === 2 ? 'bg-amber-100 text-amber-600' :
                                                    'bg-gray-50 text-gray-400'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                {idx < 3 && (
                                                    <Trophy className={`w-4 h-4 flex-shrink-0 ${medalColor(idx)}`} />
                                                )}
                                                <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{alumno.nombre}</span>
                                                <span className={`text-sm font-black px-3 py-1 rounded-lg ${
                                                    alumno.puntaje !== null ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {alumno.puntaje !== null ? alumno.puntaje : '--'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6 space-y-4">
                        {/* Filtros de Sede, Área, Turno */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={filterSede}
                                    onChange={(e) => { setFilterSede(e.target.value); setSelectedEmployee(''); setPersonSearch(''); }}
                                    className="pl-9 w-full py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white transition-all"
                                >
                                    <option value="">Todas las Sedes</option>
                                    {config?.sedes?.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={filterArea}
                                    onChange={(e) => { setFilterArea(e.target.value); setSelectedEmployee(''); setPersonSearch(''); }}
                                    className="pl-9 w-full py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white transition-all"
                                >
                                    <option value="">Todas las Áreas</option>
                                    {config?.areas?.map((a, i) => <option key={i} value={a}>{a}</option>)}
                                </select>
                            </div>

                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={filterTurno}
                                    onChange={(e) => { setFilterTurno(e.target.value); setSelectedEmployee(''); setPersonSearch(''); }}
                                    className="pl-9 w-full py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white transition-all"
                                >
                                    <option value="">Todos los Turnos</option>
                                    {config?.turnos?.map((t, i) => (
                                        <option key={i} value={t.nombre || t}>{t.nombre || t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Selección de Alumno (Combo) y Mes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Alumno</label>
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Buscar alumno..."
                                            value={comboOpen
                                                ? personSearch
                                                : selectedEmployee
                                                    ? (() => { const e = employees.find(e => e.id === selectedEmployee); return e ? `${e.nombre} ${e.apellido}` : ''; })()
                                                    : ''
                                            }
                                            onFocus={() => { setComboOpen(true); setPersonSearch(''); }}
                                            onChange={(e) => setPersonSearch(e.target.value)}
                                            onBlur={() => setTimeout(() => setComboOpen(false), 150)}
                                            className="w-full pl-9 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                                        />
                                        {selectedEmployee && !comboOpen && (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => { e.preventDefault(); setSelectedEmployee(''); setPersonSearch(''); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {comboOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                            {filteredForCombo.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-gray-400 text-center">Sin resultados</div>
                                            ) : (
                                                filteredForCombo.map(emp => (
                                                    <div
                                                        key={emp.id}
                                                        onMouseDown={() => { setSelectedEmployee(emp.id); setComboOpen(false); }}
                                                        className={`px-4 py-2.5 cursor-pointer text-sm hover:bg-blue-50 ${selectedEmployee === emp.id ? 'bg-blue-50 font-bold text-blue-700' : 'text-gray-700'}`}
                                                    >
                                                        <span className="font-medium">{emp.nombre} {emp.apellido}</span>
                                                        <span className="text-gray-400 text-xs ml-2">
                                                            {emp.sede && `· ${emp.sede}`} {emp.turno && `· ${emp.turno}`}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
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
            )}
        </div>
    );
};

export default Academico;

