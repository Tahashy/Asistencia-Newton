import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Filter, Download, FileText, Table, MessageCircle, Search, X
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reportes = () => {
    const { employees, attendance, config, showToast } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedSede, setSelectedSede] = useState('');
    const [selectedTurno, setSelectedTurno] = useState('');
    const [dateRange, setDateRange] = useState({ inicio: '', fin: '' });
    const [personSearch, setPersonSearch] = useState('');
    const [comboOpen, setComboOpen] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const formatFecha = (isoString) => {
        if (!isoString) return '-';
        // Si ya viene en formato YYYY-MM-DD, lo formateamos directamente para evitar desfases de zona horaria
        if (typeof isoString === 'string' && isoString.includes('-') && isoString.length === 10) {
            const [year, month, day] = isoString.split('-');
            return `${day}/${month}/${year}`;
        }
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return isoString;
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'UTC' // Forzamos UTC para evitar que el navegador reste horas
            });
        } catch (e) {
            return isoString;
        }
    };

    const formatHora = (isoString) => {
        if (!isoString) return '-';
        if (typeof isoString === 'string' && isoString.includes(':') && isoString.length <= 8) return isoString;
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return isoString;
            return date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            return isoString;
        }
    };
    const formatFechaLong = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        } catch (e) { return ''; }
    };

    const handleWhatsAppSend = () => {
        if (!data || !selectedEmployee) return;

        const employee = employees.find(e => e.id === selectedEmployee);
        if (!employee || !employee.telefono) {
            showToast('No se encontró un número de teléfono para este registro.', 'warning');
            return;
        }

        const mesReporte = dateRange.inicio 
            ? formatFechaLong(dateRange.inicio) 
            : new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        // Generar iconos dinámicamente para evitar errores de codificación del archivo .js
        const i = {
            school: String.fromCodePoint(0x1F3EB),
            hello: String.fromCodePoint(0x1F44B),
            user: String.fromCodePoint(0x1F464),
            calendar: String.fromCodePoint(0x1F4C5),
            chart: String.fromCodePoint(0x1F4CA),
            check: String.fromCodePoint(0x2705),
            wait: String.fromCodePoint(0x23F3),
            error: String.fromCodePoint(0x274C),
            trend: String.fromCodePoint(0x1F4C8),
            star: String.fromCodePoint(0x2728)
        };

        const incidencias = [];
        data.records.forEach(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            if (emp?.turno === 'Doble Turno') {
                if (r.manana?.estado !== 'Presente') incidencias.push({ fecha: r.fecha, estado: r.manana.estado, hora: r.manana.hora, turno: 'Mañana' });
                if (r.tarde?.estado !== 'Presente') incidencias.push({ fecha: r.fecha, estado: r.tarde.estado, hora: r.tarde.hora, turno: 'Tarde' });
            } else {
                if (r.unico?.estado !== 'Presente') incidencias.push({ fecha: r.fecha, estado: r.unico?.estado, hora: r.unico?.hora, turno: '' });
            }
        });
        const topIncidencias = incidencias.slice(0, 10);

        let detString = '';
        if (topIncidencias.length > 0) {
            detString = '\n\n*DETALLE DE INCIDENCIAS:*\n' + 
                topIncidencias.map(r => {
                    const icon = r.estado === 'Tardanza' ? i.wait : i.error;
                    const time = r.estado === 'Tardanza' ? ` (${formatHora(r.hora)})` : '';
                    const turnoTxt = r.turno ? ` [${r.turno}]` : '';
                    return `${icon} ${formatFecha(r.fecha)}${turnoTxt}: ${r.estado}${time}`;
                }).join('\n');
        } else {
            detString = `\n\n${i.star} *¡Excelente! Sin faltas ni tardanzas.*`;
        }

        const ent = (config?.nombreEntidad || 'SISTEMA').toUpperCase();
        const msg = 
`*${i.school} ${ent}*
*REPORTE DE ASISTENCIA*

¡Hola! ${i.hello} Buenos días.
Resumen detallado de:
${i.user} *${employee.nombre} ${employee.apellido}*
${i.calendar} Periodo: *${mesReporte}*

------------------------------------------
${i.chart} *RESUMEN GENERAL*
------------------------------------------
${i.check} *Asistencias:* ${data.presentes}
${i.wait} *Tardanzas:* ${data.tardanzas}
${i.error} *Faltas:* ${data.faltas}
${i.trend} *Cumplimiento:* ${data.porcentaje}%
${detString}

------------------------------------------
_Reporte generado automáticamente._`.trim();

        const phone = String(employee.telefono).replace(/\D/g, '');
        const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const getFilteredData = () => {
        const activeEmployees = employees.filter(e => e.activo);
        
        let empsToCheck = activeEmployees;
        if (selectedEmployee) {
            empsToCheck = empsToCheck.filter(e => e.id === selectedEmployee);
        } else if (selectedArea || selectedSede || selectedTurno) {
            empsToCheck = empsToCheck.filter(emp =>
                (!selectedArea || emp.area === selectedArea) &&
                (!selectedSede || emp.sede === selectedSede) &&
                (!selectedTurno || emp.turno === selectedTurno)
            );
        }

        const hoy = new Date().toISOString().split('T')[0];
        const inicio = dateRange.inicio || (selectedEmployee || selectedArea || selectedSede || selectedTurno ? '' : hoy);
        const fin = dateRange.fin || inicio || hoy;

        const dateList = [];
        if (inicio && fin) {
            const start = new Date(inicio + 'T00:00:00');
            const end = new Date(fin + 'T00:00:00');
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dateList.push(d.toISOString().split('T')[0]);
            }
        } else if (inicio) {
            dateList.push(inicio);
        }

        const recordsMap = new Map();
        attendance.forEach(a => {
            const key = `${a.employeeId}_${a.fecha}`;
            if (!recordsMap.has(key)) recordsMap.set(key, { manana: null, tarde: null, unico: null });
            const dayRecord = recordsMap.get(key);
            const emp = employees.find(e => e.id === a.employeeId);
            
            if (emp?.turno === 'Doble Turno') {
                if (a.horaSalida && a.horaSalida !== '-') {
                    dayRecord.manana = { hora: a.horaEntrada, estado: a.estado };
                    dayRecord.tarde = { hora: a.horaSalida, estado: 'Presente' };
                } else {
                    const h = parseInt(a.horaEntrada?.split(':')[0] || 0);
                    if (h < 13) dayRecord.manana = { hora: a.horaEntrada, estado: a.estado };
                    else dayRecord.tarde = { hora: a.horaEntrada, estado: a.estado };
                }
            } else {
                dayRecord.unico = { hora: a.horaEntrada, estado: a.estado };
            }
        });

        const finalRecords = [];
        let presentes = 0, tardanzas = 0, faltas = 0;

        empsToCheck.forEach(emp => {
            const daysToProcess = dateList.length > 0 ? dateList : [...new Set(attendance.filter(a => a.employeeId === emp.id).map(a => a.fecha))];
            
            daysToProcess.forEach(fecha => {
                const key = `${emp.id}_${fecha}`;
                const raw = recordsMap.get(key) || { manana: null, tarde: null, unico: null };
                
                const rec = { id: key, employeeId: emp.id, fecha, turno: emp.turno };
                
                if (emp.turno === 'Doble Turno') {
                    rec.manana = raw.manana || { hora: '-', estado: 'Falta' };
                    rec.tarde = raw.tarde || { hora: '-', estado: 'Falta' };
                    
                    if (rec.manana.estado === 'Presente') presentes++;
                    if (rec.manana.estado === 'Tardanza') tardanzas++;
                    if (rec.manana.estado.startsWith('Falta')) faltas++;
                    
                    if (rec.tarde.estado === 'Presente') presentes++;
                    if (rec.tarde.estado === 'Tardanza') tardanzas++;
                    if (rec.tarde.estado.startsWith('Falta')) faltas++;
                } else {
                    rec.unico = raw.unico || { hora: '-', estado: 'Falta' };
                    if (rec.unico.estado === 'Presente') presentes++;
                    if (rec.unico.estado === 'Tardanza') tardanzas++;
                    if (rec.unico.estado.startsWith('Falta')) faltas++;
                }
                
                // Si no buscamos fechas específicas y es falta, lo ignoramos para no ensuciar el reporte general
                if (dateList.length === 0 && ((emp.turno === 'Doble Turno' && rec.manana.estado.startsWith('Falta') && rec.tarde.estado.startsWith('Falta')) || (emp.turno !== 'Doble Turno' && rec.unico.estado.startsWith('Falta')))) {
                    return;
                }

                finalRecords.push(rec);
            });
        });

        finalRecords.sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || a.employeeId.localeCompare(b.employeeId));
        
        const total = presentes + tardanzas + faltas;
        return {
            records: finalRecords,
            presentes, tardanzas, faltas,
            porcentaje: total > 0 ? Math.round(((presentes + tardanzas) / total) * 100) : 0
        };
    };

    const data = (selectedEmployee || selectedArea || selectedSede || selectedTurno || dateRange.inicio || dateRange.fin) ? getFilteredData() : null;

    // Lógica de Paginación para los registros
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRecords = data?.records?.slice(indexOfFirstItem, indexOfLastItem) || [];
    const totalPages = data ? Math.ceil(data.records.length / itemsPerPage) : 0;

    const isTardeShift = (turno) => turno && turno !== 'Doble Turno' && turno.toLowerCase().includes('tarde');

    // Determinar qué columnas mostrar basándonos en los datos actuales
    const hasMañana = data?.records?.some(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return emp?.turno === 'Doble Turno' || !isTardeShift(emp?.turno);
    }) ?? true;

    const hasTarde = data?.records?.some(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return emp?.turno === 'Doble Turno' || isTardeShift(emp?.turno);
    }) ?? false;

    // FUNCIONES DE EXPORTACIÓN
    const exportToExcel = () => {
        if (!data || data.records.length === 0) return;

        const worksheetData = data.records.map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            const isDoble = emp?.turno === 'Doble Turno';
            const isTarde = isTardeShift(emp?.turno);
            
            const row = {
                'Nombre y Apellido': `${emp?.nombre} ${emp?.apellido}`,
                'ID': r.employeeId,
                'Área': emp?.area || '-',
                'Sede': emp?.sede || '-',
                'Turno': emp?.turno || '-',
                'Fecha': formatFecha(r.fecha)
            };
            
            if (hasMañana) {
                row['Turno Mañana (Hora)'] = isDoble ? formatHora(r.manana?.hora) : (!isTarde ? formatHora(r.unico?.hora) : '-');
                row['Turno Mañana (Estado)'] = isDoble ? r.manana?.estado : (!isTarde ? (r.unico?.estado || '-') : '-');
            }
            
            if (hasTarde) {
                row['Turno Tarde (Hora)'] = isDoble ? formatHora(r.tarde?.hora) : (isTarde ? formatHora(r.unico?.hora) : '-');
                row['Turno Tarde (Estado)'] = isDoble ? r.tarde?.estado : (isTarde ? (r.unico?.estado || '-') : '-');
            }
            
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Asistencia");
        XLSX.writeFile(workbook, `Reporte_Asistencia_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        if (!data || data.records.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Reporte de Asistencia", 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

        const tableColumn = ["Empleado", "Fecha"];
        if (hasMañana) { tableColumn.push("T. Mañana", "Estado"); }
        if (hasTarde) { tableColumn.push("T. Tarde", "Estado"); }

        const tableRows = data.records.map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            const isDoble = emp?.turno === 'Doble Turno';
            const isTarde = isTardeShift(emp?.turno);
            
            const row = [
                `${emp?.nombre} ${emp?.apellido}`,
                formatFecha(r.fecha)
            ];
            
            if (hasMañana) {
                row.push(
                    isDoble ? formatHora(r.manana?.hora) : (!isTarde ? formatHora(r.unico?.hora) : '-'),
                    isDoble ? r.manana?.estado : (!isTarde ? (r.unico?.estado || '-') : '-')
                );
            }
            
            if (hasTarde) {
                row.push(
                    isDoble ? formatHora(r.tarde?.hora) : (isTarde ? formatHora(r.unico?.hora) : '-'),
                    isDoble ? r.tarde?.estado : (isTarde ? (r.unico?.estado || '-') : '-')
                );
            }
            
            return row;
        });

        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 35, theme: 'striped', headStyles: { fillColor: [59, 130, 246] } });
        doc.save(`Reporte_Asistencia_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Reportes de Asistencia</h2>
                <p className="text-gray-600">Consulta y exporta reportes detallados de {config?.nombreEntidadPlural?.toLowerCase() || 'personal'}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                    <Filter className="w-5 h-5 text-blue-600" />
                    Panel de Filtros
                </h3>

                <div className="space-y-6">
                    {/* Primera fila: Personal y Rango */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Persona</label>
                            <div className="relative">
                                {/* Input con nombre del seleccionado o búsqueda */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar persona..."
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
                                            onMouseDown={(e) => { e.preventDefault(); setSelectedEmployee(''); setPersonSearch(''); setCurrentPage(1); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown */}
                                {comboOpen && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                        {/* Opción "Todos" */}
                                        <div
                                            onMouseDown={() => { setSelectedEmployee(''); setComboOpen(false); setCurrentPage(1); }}
                                            className={`px-4 py-2.5 cursor-pointer text-sm hover:bg-blue-50 ${!selectedEmployee ? 'bg-blue-50 font-bold text-blue-700' : 'text-gray-700'}`}
                                        >
                                            Todos los registros
                                        </div>
                                        {/* Lista filtrada */}
                                        {employees
                                            .filter(emp => {
                                                const q = personSearch.toLowerCase();
                                                return (
                                                    (emp.nombre || '').toLowerCase().includes(q) ||
                                                    (emp.apellido || '').toLowerCase().includes(q) ||
                                                    (emp.id || '').toLowerCase().includes(q)
                                                );
                                            })
                                            .map(emp => (
                                                <div
                                                    key={emp.id}
                                                    onMouseDown={() => { setSelectedEmployee(emp.id); setComboOpen(false); setCurrentPage(1); }}
                                                    className={`px-4 py-2.5 cursor-pointer text-sm hover:bg-blue-50 ${selectedEmployee === emp.id ? 'bg-blue-50 font-bold text-blue-700' : 'text-gray-700'}`}
                                                >
                                                    <span className="font-medium">{emp.nombre} {emp.apellido}</span>
                                                    <span className="text-gray-400 text-xs ml-2">({emp.id})</span>
                                                </div>
                                            ))
                                        }
                                        {employees.filter(emp => {
                                            const q = personSearch.toLowerCase();
                                            return (emp.nombre || '').toLowerCase().includes(q) || (emp.apellido || '').toLowerCase().includes(q) || (emp.id || '').toLowerCase().includes(q);
                                        }).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-gray-400 text-center">Sin resultados</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Desde</label>
                            <input
                                type="date"
                                value={dateRange.inicio}
                                onChange={(e) => { setDateRange({ ...dateRange, inicio: e.target.value }); setCurrentPage(1); }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hasta</label>
                            <input
                                type="date"
                                value={dateRange.fin}
                                onChange={(e) => { setDateRange({ ...dateRange, fin: e.target.value }); setCurrentPage(1); }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Segunda fila: Área, Sede y Turno */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Filtrar por Área</label>
                            <select
                                value={selectedArea}
                                onChange={(e) => { setSelectedArea(e.target.value); setCurrentPage(1); }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                            >
                                <option value="">Todas las áreas</option>
                                {config?.areas?.map((area, index) => (
                                    <option key={index} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Filtrar por Sede</label>
                            <select
                                value={selectedSede}
                                onChange={(e) => { setSelectedSede(e.target.value); setCurrentPage(1); }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                            >
                                <option value="">Todas las sedes</option>
                                {config?.sedes?.map((sede, index) => (
                                    <option key={index} value={sede}>{sede}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Filtrar por Turno</label>
                            <select
                                value={selectedTurno}
                                onChange={(e) => { setSelectedTurno(e.target.value); setCurrentPage(1); }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                            >
                                <option value="">Todos los turnos</option>
                                {config?.turnos?.map((turno, index) => (
                                    <option key={index} value={turno.nombre || turno}>{turno.nombre || turno}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {data ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-green-500">
                            <p className="text-gray-500 text-sm font-semibold mb-1">Presentes</p>
                            <p className="text-3xl font-bold text-gray-800">{data.presentes}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-yellow-500">
                            <p className="text-gray-500 text-sm font-semibold mb-1">Tardanzas</p>
                            <p className="text-3xl font-bold text-gray-800">{data.tardanzas}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-red-500">
                            <p className="text-gray-500 text-sm font-semibold mb-1">Faltas</p>
                            <p className="text-3xl font-bold text-gray-800">{data.faltas}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-500">
                            <p className="text-gray-500 text-sm font-semibold mb-1">% Asistencia</p>
                            <p className="text-3xl font-bold text-gray-800">{data.porcentaje}%</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-gray-100 gap-4">
                            <h3 className="text-xl font-bold text-gray-800">Detalle de Registros</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {selectedEmployee && (
                                    <button
                                        onClick={handleWhatsAppSend}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-green-100 text-sm active:scale-95"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Enviar WhatsApp
                                    </button>
                                )}
                                <button
                                    onClick={exportToExcel}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-green-100 text-sm"
                                >
                                    <Table className="w-4 h-4" />
                                    Excel
                                </button>
                                <button
                                    onClick={exportToPDF}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-red-100 text-sm"
                                >
                                    <FileText className="w-4 h-4" />
                                    PDF / Imprimir
                                </button>
                            </div>
                        </div>

                        {data.records.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Empleado</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                            {hasMañana && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Turno Mañana</th>}
                                            {hasTarde && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Turno Tarde</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {currentRecords.map(record => {
                                            const emp = employees.find(e => e.id === record.employeeId);
                                            const isDoble = emp?.turno === 'Doble Turno';
                                            const isTarde = isTardeShift(emp?.turno);
                                            
                                            const renderTurno = (turnoData) => {
                                                if (!turnoData) return <span className="text-gray-300">-</span>;
                                                return (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="font-mono text-sm text-gray-600">{formatHora(turnoData.hora)}</span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                            turnoData.estado === 'Presente' ? 'bg-green-100 text-green-700' :
                                                            turnoData.estado === 'Tardanza' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {turnoData.estado}
                                                        </span>
                                                    </div>
                                                );
                                            };

                                            return (
                                                <tr key={record.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-800">{emp?.nombre} {emp?.apellido}</p>
                                                        <p className="text-xs text-gray-500">{emp?.area} | {emp?.sede} | {emp?.turno}</p>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-700">{formatFecha(record.fecha)}</td>
                                                    
                                                    {hasMañana && (
                                                        <td className="px-6 py-4 text-center">
                                                            {isDoble ? renderTurno(record.manana) : (!isTarde ? renderTurno(record.unico) : <span className="text-gray-300">-</span>)}
                                                        </td>
                                                    )}
                                                    
                                                    {hasTarde && (
                                                        <td className="px-6 py-4 text-center">
                                                            {isDoble ? renderTurno(record.tarde) : (isTarde ? renderTurno(record.unico) : <span className="text-gray-300">-</span>)}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-gray-400 font-medium italic">No se encontraron registros con los filtros seleccionados</p>
                            </div>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </>
            ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-12 text-center">
                    <p className="text-blue-700 font-medium">Usa los filtros superiores para generar un reporte detallado</p>
                </div>
            )}
        </div>
    );
};

export default Reportes;
