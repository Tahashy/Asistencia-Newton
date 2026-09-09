import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    CheckCircle, Search, X, Filter, Briefcase, Clock
} from 'lucide-react';

const Justificaciones = () => {
    const { employees, attendance, registrarJustificacion, config } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [motivo, setMotivo] = useState('');
    const [selectedShift, setSelectedShift] = useState('Mañana');

    // Estados del combo buscador
    const [personSearch, setPersonSearch] = useState('');
    const [comboOpen, setComboOpen] = useState(false);

    // Filtros para reducir la lista del combo
    const [filterSede, setFilterSede] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterTurno, setFilterTurno] = useState('');

    const selectedEmp = employees.find(e => e.id === selectedEmployee);

    React.useEffect(() => {
        if (selectedEmp) {
            if (selectedEmp.turno === 'Doble Turno') {
                setSelectedShift('Doble Turno (Ambos)');
            } else if (selectedEmp.turno === 'Tarde') {
                setSelectedShift('Tarde');
            } else {
                setSelectedShift('Mañana');
            }
        }
    }, [selectedEmployee]);

    const handleSubmit = (e) => {
        e.preventDefault();
        registrarJustificacion(selectedEmployee, selectedDate, motivo, selectedShift);
        setSelectedEmployee('');
        setSelectedDate('');
        setMotivo('');
        setPersonSearch('');
        setSelectedShift('Mañana');
    };

    // Lista filtrada de empleados (por sede/area/turno + búsqueda en el combo)
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

    // Calcular ausencias reales de los últimos 30 días laborales.

    const calcularFaltasPendientes = () => {
        const diasLaborales = config?.diasLaborales || [1, 2, 3, 4, 5];
        const empleadosActivos = employees.filter(e => e.activo);
        const hoy = new Date();
        let count = 0;

        for (let i = 1; i <= 30; i++) {
            const dia = new Date(hoy);
            dia.setDate(hoy.getDate() - i);
            const diaNum = dia.getDay();
            if (!diasLaborales.includes(diaNum)) continue;
            const fechaStr = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
            empleadosActivos.forEach(emp => {
                const tieneRegistro = attendance.some(a => a.employeeId === emp.id && a.fecha === fechaStr);
                if (!tieneRegistro) count++;
            });
        }
        return count;
    };

    const totalFaltasPendientes = calcularFaltasPendientes();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Justificaciones</h2>
                <p className="text-gray-600">{totalFaltasPendientes} {totalFaltasPendientes === 1 ? 'falta pendiente' : 'faltas pendientes'} de justificar (últimos 30 días)</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-5">Nueva Justificación</h3>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* ── Filtros de Sede / Área / Turno ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Filtro Sede */}
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

                        {/* Filtro Área */}
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

                        {/* Filtro Turno */}
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

                    {/* ── Combo buscador de alumno + turno + fecha ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* Combo con buscador */}
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder={`Buscar ${config?.nombreEntidadSingular?.toLowerCase() || 'alumno'}...`}
                                    value={comboOpen
                                        ? personSearch
                                        : selectedEmp
                                            ? `${selectedEmp.nombre} ${selectedEmp.apellido}`
                                            : ''
                                    }
                                    onFocus={() => { setComboOpen(true); setPersonSearch(''); }}
                                    onChange={(e) => setPersonSearch(e.target.value)}
                                    onBlur={() => setTimeout(() => setComboOpen(false), 150)}
                                    required={!selectedEmployee}
                                    className="w-full pl-9 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
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

                            {/* Input oculto para validación del formulario */}
                            <input type="text" value={selectedEmployee} required readOnly className="sr-only" />
                        </div>

                        {/* Selector de Turno a Justificar */}
                        <div>
                            <select
                                value={selectedShift}
                                onChange={(e) => setSelectedShift(e.target.value)}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white font-medium text-gray-700"
                            >
                                {selectedEmp?.turno === 'Doble Turno' ? (
                                    <>
                                        <option value="Doble Turno (Ambos)">Justificar Doble Turno (Ambos)</option>
                                        <option value="Mañana">Justificar solo Turno Mañana</option>
                                        <option value="Tarde">Justificar solo Turno Tarde</option>
                                    </>
                                ) : selectedEmp?.turno === 'Tarde' ? (
                                    <>
                                        <option value="Tarde">Justificar Turno Tarde</option>
                                        <option value="Mañana">Justificar Turno Mañana</option>
                                        <option value="Doble Turno (Ambos)">Justificar Doble Turno (Ambos)</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Mañana">Justificar Turno Mañana</option>
                                        <option value="Tarde">Justificar Turno Tarde</option>
                                        <option value="Doble Turno (Ambos)">Justificar Doble Turno (Ambos)</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Fecha */}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>


                    {/* Motivo */}
                    <textarea
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Motivo de la justificación..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                        rows="4"
                        required
                    ></textarea>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Registrar Justificación
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Historial de Justificaciones</h3>
                <div className="space-y-3">
                    {attendance.filter(a => a.justificacion).length > 0 ? (
                        attendance.filter(a => a.justificacion).map(record => {
                            const emp = employees.find(e => e.id === record.employeeId);
                            return (
                                <div key={record.id} className="border-2 border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold">{emp?.nombre} {emp?.apellido}</p>
                                            <p className="text-sm text-gray-600">{record.fecha}</p>
                                            <p className="text-sm text-gray-700 mt-2">{record.justificacion}</p>
                                        </div>
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                            Justificado
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-8">No hay justificaciones registradas</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Justificaciones;
