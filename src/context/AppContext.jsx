// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as appsScript from '../services/appsScriptService';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [config, setConfig] = useState(null);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [academicRecords, setAcademicRecords] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    loadInitialData();

  }, [currentUser]);




  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      let configData = await appsScript.getConfig();
      
      // Parsear arrays de Google Sheets que vienen como strings
      if (configData) {
        try { if (typeof configData.areas === 'string') configData.areas = JSON.parse(configData.areas); } catch (e) {}
        try { if (typeof configData.sedes === 'string') configData.sedes = JSON.parse(configData.sedes); } catch (e) {}
        try { if (typeof configData.diasLaborales === 'string') configData.diasLaborales = JSON.parse(configData.diasLaborales); } catch (e) {}
      }
      setConfig(configData);

      const employeesData = await appsScript.getEmployees();
      setEmployees(employeesData);

      const attendanceData = await appsScript.getAttendance();
      setAttendance(attendanceData);

      const academicData = await appsScript.getAcademicRecords();
      setAcademicRecords(academicData);

      showToast('Datos cargados correctamente', 'success');
    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast('Error al cargar datos de Google Sheets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    setIsLoading(true);
    try {
      const result = await appsScript.login(email, password);

      if (result.success) {
        setCurrentUser(result.data);
        // Guardar en localStorage
        localStorage.setItem('currentUser', JSON.stringify(result.data));
        showToast('Inicio de sesión exitoso', 'success');
        return { success: true };
      } else {
        showToast(result.error || 'Error al iniciar sesión', 'error');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error en login:', error);
      showToast('Error al iniciar sesión', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };


  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    showToast('Sesión cerrada correctamente', 'success');
  };

  const hideToast = () => setToast(null);

  const getCurrentDate = (dateObj = new Date()) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = (dateObj = new Date()) => {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Simplificación: Eliminamos la dependencia crítica de WorldTimeAPI para ganar velocidad.
  // El servidor de Google (Lima) asignará la hora final para el libro de Excel.
  const getNetworkTime = async () => {
    return new Date(); // Usamos tiempo local rápido como base
  };

  const calcularEstado = (horaEntrada, employeeId) => {
    if (!config) return 'Presente';

    const emp = employees.find(e => e.id === employeeId);
    const turno = emp?.turno || 'Mañana';

    // Si es turno tarde, siempre presente
    if (turno === 'Tarde') return 'Presente';

    const [hourEntrada, minEntrada] = horaEntrada.split(':').map(Number);
    
    // Si es doble turno y marca en la tarde (asumimos desde la 1 PM), siempre presente en ese momento
    if (turno === 'Doble Turno' && hourEntrada >= 13) {
      return 'Presente';
    }

    const [hourConfig, minConfig] = config.horaEntrada.split(':').map(Number);
    const minutosEntrada = hourEntrada * 60 + minEntrada;
    const minutosConfig = hourConfig * 60 + minConfig;
    const diferencia = minutosEntrada - minutosConfig;

    if (diferencia <= 0) return 'Presente';
    if (diferencia <= config.toleranciaMinutos) return 'Presente';

    return 'Tardanza';
  };

  const [lastProcessedId, setLastProcessedId] = useState({ id: '', time: 0 });
  const [pendingIds, setPendingIds] = useState(new Set());

  const registrarAsistencia = async (employeeId, metodo = 'Manual') => {
    // PROTECCIÓN ANTI-DUPLICADOS (Throttling y Bloqueo de Estado)
    const nowTs = Date.now();
    
    if (pendingIds.has(employeeId)) {
      console.log('Petición ya en curso para:', employeeId);
      return { success: false, pending: true };
    }

    if (lastProcessedId.id === employeeId && (nowTs - lastProcessedId.time) < 5000) {
      console.log('Ignorando petición reciente para:', employeeId);
      return { success: false, duplicate: true };
    }
    
    setPendingIds(prev => new Set(prev).add(employeeId));
    setLastProcessedId({ id: employeeId, time: nowTs });
    setIsLoading(true);
    try {
      // Extraer el turno del empleado
      const emp = employees.find(e => e.id === employeeId);
      const turno = emp?.turno || 'Mañana';

      // Enviamos el payload con doble nombre de campo para máxima compatibilidad
      const payload = {
        employeeId: employeeId,
        ID_Empleado: employeeId, 
        metodoRegistro: metodo,
        registradoPor: currentUser?.nombre || 'Sistema',
        turno: turno
      };

      const response = await appsScript.addAttendance(payload);
      
      if (response.success) {
        // IMPORTANTE: Recargar asistencias en segundo plano sin bloquear la interfaz
        appsScript.getAttendance().then(setAttendance).catch(console.error);
        
        // El servidor v6.5 devuelve la acción en response.data.action
        const actionResult = response.data?.action || 'REGISTRO';
        const msg = actionResult === 'SALIDA' 
          ? 'Salida registrada correctamente' 
          : 'Entrada registrada correctamente';
          
        showToast(msg, 'success');
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      showToast(error.message || 'Error al procesar asistencia', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(employeeId);
        return next;
      });
    }
  };

  const registrarEntrada = (id, metodo) => registrarAsistencia(id, metodo || 'QR');
  const registrarSalida = (id, metodo) => registrarAsistencia(id, metodo || 'QR');

  const registrarJustificacion = async (employeeId, fecha, motivo) => {
    setIsLoading(true);
    try {
      const payload = {
        employeeId,
        fecha,
        justificacion: motivo,
        registradoPor: currentUser?.nombre || 'Admin'
      };

      // Usamos la nueva función del servicio
      const response = await appsScript.saveJustification(payload);
      
      // Recarga asíncrona silenciosa
      appsScript.getAttendance().then(setAttendance).catch(console.error);
      
      if (response.success) {
        showToast('Justificación registrada correctamente', 'success');
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error al registrar justificación:', error);
      showToast('Error al registrar justificación', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const agregarEmpleado = async (empleadoData) => {
    setIsLoading(true);
    try {
      const nuevoId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
      
      let foto_url = null;
      if (empleadoData.fotoFile) {
        const uploadResult = await appsScript.uploadProfilePhoto(empleadoData.fotoFile, nuevoId);
        if (uploadResult.success) {
          foto_url = uploadResult.url;
        }
      }

      const nuevoEmpleado = {
        ...empleadoData,
        id: nuevoId,
        qrCode: `${nuevoId}-QR-HASH-${Date.now()}`,
        activo: true,
        fechaCreacion: getCurrentDate(),
        foto_url
      };
      
      delete nuevoEmpleado.fotoFile;

      const result = await appsScript.addEmployee(nuevoEmpleado);
      
      if (!result.success) {
        showToast(result.error || 'Error al guardar en base de datos', 'error');
        return { success: false };
      }

      setEmployees([...employees, nuevoEmpleado]);
      showToast('Empleado creado correctamente', 'success');
      return { success: true, data: nuevoEmpleado };
    } catch (error) {
      console.error('Error al agregar empleado:', error);
      showToast('Error al crear empleado', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const actualizarEmpleado = async (id, data) => {
    setIsLoading(true);
    try {
      const employee = employees.find(e => e.id === id);
      let foto_url = data.foto_url || employee.foto_url;
      
      if (data.fotoFile) {
        const uploadResult = await appsScript.uploadProfilePhoto(data.fotoFile, id);
        if (uploadResult.success) {
          foto_url = uploadResult.url;
        }
      }

      const updatedEmployee = { ...employee, ...data, foto_url };
      delete updatedEmployee.fotoFile;

      const result = await appsScript.updateEmployee(id, updatedEmployee);
      
      if (!result.success) {
        showToast(result.error || 'Error al actualizar en base de datos', 'error');
        return { success: false };
      }

      setEmployees(employees.map(e => e.id === id ? updatedEmployee : e));
      showToast('Empleado actualizado correctamente', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      showToast('Error al actualizar empleado', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const eliminarEmpleado = async (id) => {
    setIsLoading(true);
    try {
      await appsScript.deleteEmployee(id);
      setEmployees(employees.filter(e => e.id !== id));
      showToast('Empleado eliminado correctamente', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      showToast('Error al eliminar empleado', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const eliminarTodo = async () => {
    setIsLoading(true);
    try {
      await appsScript.deleteAllData();
      setEmployees([]);
      setAttendance([]);
      showToast('Sistema purgado: Todos los datos han sido eliminados.', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error al vaciar la base de datos:', error);
      showToast('Error al vaciar la base de datos', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const regenerarQR = async (employeeId) => {
    setIsLoading(true);
    try {
      const nuevoQR = `${employeeId}-QR-HASH-${Date.now()}`;
      const employee = employees.find(e => e.id === employeeId);

      await appsScript.updateEmployee(employeeId, { ...employee, qrCode: nuevoQR });
      setEmployees(employees.map(e =>
        e.id === employeeId ? { ...e, qrCode: nuevoQR } : e
      ));

      showToast('Código QR regenerado correctamente', 'success');
      return { success: true, qrCode: nuevoQR };
    } catch (error) {
      console.error('Error al regenerar QR:', error);
      showToast('Error al regenerar QR', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };


  const actualizarConfiguracion = async (newConfig) => {
    setIsLoading(true);
    try {
      // Como ahora usamos Supabase (BD Relacional real), ya no necesitamos 
      // convertir los arrays a string como hacíamos con Google Sheets.
      const configToSave = { ...newConfig };

      await appsScript.updateConfig(configToSave);
      setConfig(newConfig);
      showToast('Configuración actualizada correctamente', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      showToast('Error al actualizar configuración', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const guardarNota = async (notaData) => {
    setIsLoading(true);
    try {
      const response = await appsScript.saveAcademicRecord(notaData);
      if (response.success) {
        // Actualizar estado local usando actualización funcional para evitar condiciones de carrera
        setAcademicRecords(prevRecords => {
          const existe = prevRecords.find(r => 
            String(r.ID_Alumno) === String(notaData.ID_Alumno) && 
            r.Mes === notaData.Mes
          );

          if (existe) {
            return prevRecords.map(r => 
              (String(r.ID_Alumno) === String(notaData.ID_Alumno) && r.Mes === notaData.Mes)
              ? { ...r, ...notaData }
              : r
            );
          } else {
            return [...prevRecords, { ...notaData, ID: 'AC' + Date.now() }];
          }
        });

        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error al guardar nota:', error);
      showToast('Error al guardar la nota', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadisticasDelDia = () => {
    const hoy = getCurrentDate();

    // Función para normalizar fechas a YYYY-MM-DD (Evitando desfases de zona horaria)
    const normalizar = (fechaInput) => {
      if (!fechaInput) return '';
      const str = fechaInput.toString();
      // Si ya viene como YYYY-MM-DD (ej: desde el Excel formateado), lo usamos directo
      if (str.includes('-') && str.length === 10) return str.split('T')[0].trim();
      
      const d = new Date(fechaInput);
      if (isNaN(d.getTime())) return str.split('T')[0].trim();
      
      // Si es un objeto Date real, usamos los métodos locales para que coincida con el día del usuario
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const esDiaLaboral = (fechaStr) => {
      const diasLaborales = config?.diasLaborales || [1, 2, 3, 4, 5];
      // Para obtener el día de la semana sin desfases, añadimos T00:00:00
      const diaNum = new Date(fechaStr + 'T00:00:00').getDay();
      return diasLaborales.includes(diaNum);
    };

    const hoyEsLaboral = esDiaLaboral(hoy);
    const registrosHoy = attendance.filter(a => normalizar(a.fecha) === hoy);

    const presentes = registrosHoy.filter(a => a.estado?.toLowerCase() === 'presente').length;
    const tardanzas = registrosHoy.filter(a => a.estado?.toLowerCase() === 'tardanza').length;

    // Solo contar ausentes si hoy es un día laboral Y ya pasó la hora de inicio del turno del empleado
    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

    const ausentes = hoyEsLaboral
      ? employees.filter(e => {
          if (!e.activo) return false;
          // Si ya tiene registro hoy, no es ausente
          if (registrosHoy.find(r => r.employeeId === e.id)) return false;
          // Buscar la hora de inicio del turno del empleado en la configuración
          const turnoConfig = config?.turnos?.find(t => t.nombre === e.turno);
          if (turnoConfig?.hora_entrada) {
            const [h, m] = turnoConfig.hora_entrada.split(':').map(Number);
            const minutosInicioTurno = h * 60 + m;
            // Solo es ausente si ya pasó la hora de entrada de su turno
            return minutosAhora >= minutosInicioTurno;
          }
          // Si no hay configuración de turno, usar la hora global de config
          if (config?.horaEntrada) {
            const [h, m] = config.horaEntrada.split(':').map(Number);
            return minutosAhora >= h * 60 + m;
          }
          return true;
        }).length
      : 0;

    // Distribución por Área para gráfico
    const porArea = config?.areas?.map(area => {
      const totalEnArea = employees.filter(e => e.area === area && e.activo).length;
      const presentesEnArea = registrosHoy.filter(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        const st = r.estado?.toLowerCase();
        return emp?.area === area && (st === 'presente' || st === 'tardanza');
      }).length;
      return { name: area, valor: presentesEnArea, total: totalEnArea };
    }) || [];

    const totalActivos = employees.filter(e => e.activo).length;

    return {
      presentes,
      tardanzas,
      ausentes,
      total: totalActivos,
      porcentajeAsistencia: (hoyEsLaboral && totalActivos > 0)
        ? Math.round(((presentes + tardanzas) / totalActivos) * 100)
        : 0,
      distribucionArea: porArea,
      esDiaLaboral: hoyEsLaboral
    };
  };

  const getEstadisticasHistoricas = (numDias = 7) => {
    const historicalData = [];
    const hoy = new Date();

    // Reutilizar la misma lógica de normalización
    const normalizar = (fechaInput) => {
      if (!fechaInput) return '';
      const str = fechaInput.toString();
      if (str.includes('-') && str.length === 10) return str.split('T')[0].trim();
      const d = new Date(fechaInput);
      if (isNaN(d.getTime())) return str.split('T')[0].trim();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    for (let i = numDias - 1; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const fechaStr = normalizar(fecha);

      const registrosDia = attendance.filter(a => normalizar(a.fecha) === fechaStr);
      const presentes = registrosDia.filter(a => {
        const st = a.estado?.toLowerCase();
        return st === 'presente' || st === 'tardanza';
      }).length;
      const totalAtThatDate = employees.filter(e => e.activo && (e.fechaCreacion || '0') <= fechaStr).length || employees.filter(e => e.activo).length;

      const porcentaje = totalAtThatDate > 0 ? Math.round((presentes / totalAtThatDate) * 100) : 0;

      historicalData.push({
        name: fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        porcentaje,
        presentes
      });
    }
    return historicalData;
  };

  const value = {
    currentUser,
    setCurrentUser,
    loginUser,
    logoutUser,
    employees,
    attendance,
    academicRecords,
    config,
    isLoading,
    registrarAsistencia,
    registrarEntrada,
    registrarSalida,
    getEstadisticasDelDia,
    getEstadisticasHistoricas,
    agregarEmpleado,
    actualizarEmpleado,
    eliminarEmpleado,
    eliminarTodo,
    regenerarQR,
    registrarJustificacion,
    actualizarConfiguracion,
    guardarNota,
    getCurrentDate,
    getCurrentTime,
    toast,
    showToast,
    hideToast,
    loadInitialData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export { AppProvider };

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};