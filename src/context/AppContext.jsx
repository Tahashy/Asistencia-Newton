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
      const configData = await appsScript.getConfig();
      setConfig(configData);

      const employeesData = await appsScript.getEmployees();
      setEmployees(employeesData);

      const attendanceData = await appsScript.getAttendance();
      setAttendance(attendanceData);

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

  const getCurrentDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => new Date().toTimeString().split(' ')[0].substring(0, 5);

 const calcularEstado = (horaEntrada) => {
  if (!config) return 'Presente';
  
  const [hourEntrada, minEntrada] = horaEntrada.split(':').map(Number);
  const [hourConfig, minConfig] = config.horaEntrada.split(':').map(Number);
  const minutosEntrada = hourEntrada * 60 + minEntrada;
  const minutosConfig = hourConfig * 60 + minConfig;
  const diferencia = minutosEntrada - minutosConfig;

  if (diferencia <= 0) return 'Presente';
  if (diferencia <= config.toleranciaMinutos) return 'Presente';
  
  return 'Tardanza';
};

  const registrarEntrada = async (employeeId, metodo = 'Manual') => {
    setIsLoading(true);
    try {
      const fecha = getCurrentDate();
      const hora = getCurrentTime();
      
      const registroExistente = attendance.find(
        a => a.employeeId === employeeId && a.fecha === fecha
      );

      if (registroExistente && registroExistente.horaEntrada) {
        showToast('Ya existe un registro de entrada para hoy', 'warning');
        return { success: false };
      }

      const estado = calcularEstado(hora);
      
      const nuevoRegistro = {
        id: `ATT-${Date.now()}`,
        employeeId,
        fecha,
        horaEntrada: hora,
        horaSalida: null,
        estado,
        justificacion: null,
        metodoRegistro: metodo,
        registradoPor: currentUser?.nombre || 'Sistema'
      };

      if (registroExistente) {
        await appsScript.updateAttendance(registroExistente.id, {
          horaEntrada: hora,
          horaSalida: registroExistente.horaSalida,
          estado,
          justificacion: registroExistente.justificacion
        });
        
        setAttendance(attendance.map(a => 
          a.id === registroExistente.id 
            ? { ...a, horaEntrada: hora, estado, metodoRegistro: metodo }
            : a
        ));
      } else {
        await appsScript.addAttendance(nuevoRegistro);
        setAttendance([...attendance, nuevoRegistro]);
      }

      showToast(`Entrada registrada - ${estado}`, estado === 'Tardanza' ? 'warning' : 'success');
      return { success: true, data: nuevoRegistro };
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      showToast('Error al registrar entrada', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const registrarSalida = async (employeeId) => {
    setIsLoading(true);
    try {
      const fecha = getCurrentDate();
      const hora = getCurrentTime();
      
      const registroExistente = attendance.find(
        a => a.employeeId === employeeId && a.fecha === fecha
      );

      if (!registroExistente || !registroExistente.horaEntrada) {
        showToast('No hay registro de entrada para hoy', 'error');
        return { success: false };
      }

      if (registroExistente.horaSalida) {
        showToast('Ya existe un registro de salida para hoy', 'warning');
        return { success: false };
      }

      await appsScript.updateAttendance(registroExistente.id, {
        horaEntrada: registroExistente.horaEntrada,
        horaSalida: hora,
        estado: registroExistente.estado,
        justificacion: registroExistente.justificacion
      });

      setAttendance(attendance.map(a => 
        a.id === registroExistente.id 
          ? { ...a, horaSalida: hora }
          : a
      ));

      showToast('Salida registrada correctamente', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error al registrar salida:', error);
      showToast('Error al registrar salida', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const agregarEmpleado = async (empleadoData) => {
    setIsLoading(true);
    try {
      const nuevoId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
      const nuevoEmpleado = {
        ...empleadoData,
        id: nuevoId,
        qrCode: `${nuevoId}-QR-HASH-${Date.now()}`,
        activo: true,
        fechaCreacion: getCurrentDate()
      };

      await appsScript.addEmployee(nuevoEmpleado);
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
      const updatedEmployee = { ...employee, ...data };
      
      await appsScript.updateEmployee(id, updatedEmployee);
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

  const registrarJustificacion = async (employeeId, fecha, motivo) => {
    setIsLoading(true);
    try {
      const registro = attendance.find(
        a => a.employeeId === employeeId && a.fecha === fecha
      );

      if (!registro) {
        showToast('No se encontró registro para justificar', 'error');
        return { success: false };
      }

      await appsScript.updateAttendance(registro.id, {
        horaEntrada: registro.horaEntrada,
        horaSalida: registro.horaSalida,
        estado: 'Falta Justificada',
        justificacion: motivo
      });

      setAttendance(attendance.map(a => 
        a.id === registro.id 
          ? { ...a, estado: 'Falta Justificada', justificacion: motivo }
          : a
      ));

      showToast('Justificación registrada correctamente', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error al registrar justificación:', error);
      showToast('Error al registrar justificación', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const actualizarConfiguracion = async (newConfig) => {
    setIsLoading(true);
    try {
      await appsScript.updateConfig(newConfig);
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

  const getEstadisticasDelDia = () => {
    const hoy = getCurrentDate();
    const registrosHoy = attendance.filter(a => a.fecha === hoy);
    
    const presentes = registrosHoy.filter(a => a.estado === 'Presente').length;
    const tardanzas = registrosHoy.filter(a => a.estado === 'Tardanza').length;
    const ausentes = employees.filter(e => 
      e.activo && !registrosHoy.find(r => r.employeeId === e.id)
    ).length;

    return {
      presentes,
      tardanzas,
      ausentes,
      total: employees.filter(e => e.activo).length,
      porcentajeAsistencia: employees.filter(e => e.activo).length > 0
        ? Math.round(((presentes + tardanzas) / employees.filter(e => e.activo).length) * 100)
        : 0
    };
  };

  const value = {
    currentUser,
    setCurrentUser,
    loginUser,
    logoutUser,
    employees,
    attendance,
    config,
    isLoading,
    registrarEntrada,
    registrarSalida,
    getEstadisticasDelDia,
    agregarEmpleado,
    actualizarEmpleado,
    regenerarQR,
    registrarJustificacion,
    actualizarConfiguracion,
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