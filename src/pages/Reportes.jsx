import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Filter, Download, FileText, Table, MessageCircle
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
    const [dateRange, setDateRange] = useState({ inicio: '', fin: '' });

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

        const incidencias = data.records
            .filter(r => r.estado !== 'Presente')
            .slice(0, 10);

        let detString = '';
        if (incidencias.length > 0) {
            detString = '\n\n*DETALLE DE INCIDENCIAS:*\n' + 
                incidencias.map(r => {
                    const icon = r.estado === 'Tardanza' ? i.wait : i.error;
                    const time = r.estado === 'Tardanza' ? ` (${formatHora(r.horaEntrada)})` : '';
                    return `${icon} ${formatFecha(r.fecha)}: ${r.estado}${time}`;
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
        let baseRecords = [...attendance];

        // 1. Filtrar registros existentes por criterios básicos
        if (selectedEmployee) {
            baseRecords = baseRecords.filter(a => a.employeeId === selectedEmployee);
        }

        if (selectedArea || selectedSede) {
            const matchingEmployeeIds = activeEmployees
                .filter(emp =>
                    (!selectedArea || emp.area === selectedArea) &&
                    (!selectedSede || emp.sede === selectedSede)
                )
                .map(emp => emp.id);
            baseRecords = baseRecords.filter(a => matchingEmployeeIds.includes(a.employeeId));
        }

        // 2. Determinar Rango de Fechas
        const hoy = new Date().toISOString().split('T')[0];
        const inicio = dateRange.inicio || hoy;
        const fin = dateRange.fin || hoy;

        // 3. INYECCIÓN DE FALTAS (Solo si hay un filtro de fecha o persona)
        // Para simplificar, si se filtra por un rango, aseguramos que cada empleado tenga un registro CADA DÍA
        const enrichedRecords = [...baseRecords];
        
        // Si el filtro de fechas está activo, buscamos huecos
        if (dateRange.inicio && dateRange.fin) {
            const start = new Date(dateRange.inicio + 'T00:00:00');
            const end = new Date(dateRange.fin + 'T00:00:00');
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayStr = d.toISOString().split('T')[0];
                
                // Solo inyectamos faltas para el personal filtrado (o todos si no hay filtro)
                const empsToCheck = selectedEmployee 
                    ? activeEmployees.filter(e => e.id === selectedEmployee)
                    : activeEmployees.filter(e => 
                        (!selectedArea || e.area === selectedArea) && 
                        (!selectedSede || e.sede === selectedSede)
                    );

                empsToCheck.forEach(emp => {
                    const hasRecord = baseRecords.find(r => r.employeeId === emp.id && r.fecha === dayStr);
                    if (!hasRecord) {
                        enrichedRecords.push({
                            id: `V-FALTA-${emp.id}-${dayStr}`,
                            employeeId: emp.id,
                            fecha: dayStr,
                            horaEntrada: '',
                            horaSalida: '',
                            estado: 'Falta',
                            metodoRegistro: '-',
                            virtual: true
                        });
                    }
                });
            }
        } else if (dateRange.inicio || dateRange.fin) {
            // Caso de fecha única
            const targetDate = dateRange.inicio || dateRange.fin;
            const empsToCheck = selectedEmployee 
                ? activeEmployees.filter(e => e.id === selectedEmployee)
                : activeEmployees.filter(e => 
                    (!selectedArea || e.area === selectedArea) && 
                    (!selectedSede || e.sede === selectedSede)
                );

            empsToCheck.forEach(emp => {
                const hasRecord = baseRecords.find(r => r.employeeId === emp.id && r.fecha === targetDate);
                if (!hasRecord) {
                    enrichedRecords.push({
                        id: `V-FALTA-${emp.id}-${targetDate}`,
                        employeeId: emp.id,
                        fecha: targetDate,
                        horaEntrada: '',
                        horaSalida: '',
                        estado: 'Falta',
                        metodoRegistro: '-',
                        virtual: true
                    });
                }
            });
        }

        // 4. Filtrar por rango final (por seguridad)
        let finalRecords = enrichedRecords;
        if (dateRange.inicio) finalRecords = finalRecords.filter(a => a.fecha >= dateRange.inicio);
        if (dateRange.fin) finalRecords = finalRecords.filter(a => a.fecha <= dateRange.fin);

        const presentes = finalRecords.filter(r => r.estado === 'Presente').length;
        const tardanzas = finalRecords.filter(r => r.estado === 'Tardanza').length;
        const faltas = finalRecords.filter(r => r.estado === 'Falta' || r.estado === 'Falta Justificada').length;
        const total = finalRecords.length || 0;

        return {
            records: finalRecords.sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || a.employeeId.localeCompare(b.employeeId)),
            presentes,
            tardanzas,
            faltas,
            porcentaje: total > 0 ? Math.round(((presentes + tardanzas) / total) * 100) : 0
        };
    };

    const data = (selectedEmployee || selectedArea || selectedSede || dateRange.inicio || dateRange.fin) ? getFilteredData() : null;

    // Lógica de Paginación para los registros
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRecords = data?.records?.slice(indexOfFirstItem, indexOfLastItem) || [];
    const totalPages = data ? Math.ceil(data.records.length / itemsPerPage) : 0;

    // FUNCIONES DE EXPORTACIÓN
    const exportToExcel = () => {
        if (!data || data.records.length === 0) return;

        const worksheetData = data.records.map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            return {
                'Nombre y Apellido': `${emp?.nombre} ${emp?.apellido}`,
                'ID': r.employeeId,
                'Área': emp?.area || '-',
                'Sede': emp?.sede || '-',
                'Fecha': formatFecha(r.fecha),
                'Entrada': formatHora(r.horaEntrada),
                'Salida': formatHora(r.horaSalida),
                'Estado': r.estado
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Asistencia");
        XLSX.writeFile(workbook, `Reporte_Asistencia_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        if (!data || data.records.length === 0) return;

        const doc = new jsPDF();

        // Título y filtros aplicados
        doc.setFontSize(18);
        doc.text("Reporte de Asistencia", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

        // Tabla principal
        const tableColumn = ["Empleado", "Fecha", "Entrada", "Salida", "Estado"];
        const tableRows = data.records.map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            return [
                `${emp?.nombre} ${emp?.apellido}`,
                formatFecha(r.fecha),
                formatHora(r.horaEntrada),
                formatHora(r.horaSalida),
                r.estado
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

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
                            <select
                                value={selectedEmployee}
                                onChange={(e) => { setSelectedEmployee(e.target.value); setCurrentPage(1); }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                            >
                                <option value="">Todos los registros</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.nombre} {emp.apellido} ({emp.id})
                                    </option>
                                ))}
                            </select>
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

                    {/* Segunda fila: Área y Sede */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entrada</th>
                                            <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Salida</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {currentRecords.map(record => {
                                            const emp = employees.find(e => e.id === record.employeeId);
                                            return (
                                                <tr key={record.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-800">{emp?.nombre} {emp?.apellido}</p>
                                                        <p className="text-xs text-gray-500">{emp?.area} | {emp?.sede}</p>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-700">{formatFecha(record.fecha)}</td>
                                                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{formatHora(record.horaEntrada)}</td>
                                                    <td className="px-4 py-4 text-gray-600 font-mono text-sm">{formatHora(record.horaSalida)}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${record.estado === 'Presente' ? 'bg-green-100 text-green-700' :
                                                                record.estado === 'Tardanza' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {record.estado}
                                                            </span>
                                                        </div>
                                                    </td>
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
