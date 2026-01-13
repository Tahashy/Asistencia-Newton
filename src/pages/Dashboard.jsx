import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    CheckCircle, Clock, XCircle, Users, TrendingUp, BarChart3, PieChart as PieIcon, Activity
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const Dashboard = () => {
    const { getEstadisticasDelDia, getEstadisticasHistoricas } = useApp();
    const stats = getEstadisticasDelDia();
    const historicalStats = getEstadisticasHistoricas(7);

    // Datos para el gráfico circular (Distribución de hoy)
    const pieData = useMemo(() => [
        { name: 'Presentes', value: stats.presentes, color: '#10b981' },
        { name: 'Tardanzas', value: stats.tardanzas, color: '#f59e0b' },
        { name: 'Ausentes', value: stats.ausentes, color: '#ef4444' }
    ], [stats]);

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
                <p className="text-gray-600">
                    {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* TARJETAS DE ESTADÍSTICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg border-b-4 border-green-700 active:scale-95 transition-transform cursor-default">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">Presentes</p>
                            <p className="text-4xl font-black">{stats.presentes}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-green-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-2xl shadow-lg border-b-4 border-yellow-700 active:scale-95 transition-transform cursor-default">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-xs font-bold uppercase tracking-wider mb-1">Tardanzas</p>
                            <p className="text-4xl font-black">{stats.tardanzas}</p>
                        </div>
                        <Clock className="w-12 h-12 text-yellow-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg border-b-4 border-red-700 active:scale-95 transition-transform cursor-default">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-xs font-bold uppercase tracking-wider mb-1">Ausentes</p>
                            <p className="text-4xl font-black">{stats.ausentes}</p>
                        </div>
                        <XCircle className="w-12 h-12 text-red-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-700 active:scale-95 transition-transform cursor-default">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Personal</p>
                            <p className="text-4xl font-black">{stats.total}</p>
                            <p className="text-xs text-blue-100 mt-2 font-bold px-2 py-0.5 bg-white/20 rounded-full inline-block">
                                {stats.porcentajeAsistencia}% asistencia
                            </p>
                        </div>
                        <Users className="w-12 h-12 text-blue-200 opacity-80" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GRÁFICO TENDENCIA SEMANAL */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                            Tendencia de Asistencia
                        </h3>
                        <span className="text-xs font-bold text-gray-400 uppercase">Últimos 7 días</span>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalStats}>
                                <defs>
                                    <linearGradient id="colorPorcentaje" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                                    unit="%"
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="porcentaje"
                                    stroke="#3b82f6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorPorcentaje)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRÁFICO CIRCULAR HOY */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <PieIcon className="w-6 h-6 text-indigo-600" />
                            Estado Hoy
                        </h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Activity className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Resumen</p>
                            <p className="text-sm font-bold text-gray-800">
                                {stats.presentes + stats.tardanzas} de {stats.total} han marcado asistencia.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ASISTENCIA POR ÁREA */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-emerald-600" />
                            Asistencia por Áreas
                        </h3>
                    </div>
                    <div className="h-80 w-full font-sans">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.distribucionArea} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 700, fill: '#1e293b' }}
                                    width={120}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="valor"
                                    fill="#10b981"
                                    radius={[0, 10, 10, 0]}
                                    barSize={30}
                                    label={{ position: 'right', fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
