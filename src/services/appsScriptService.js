// src/services/appsScriptService.js

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9ed1f1revMdbm34zECm0Cf007gkSfQ7KqHBrVzRbVgOcg4rVF-4BFp-JSkIXaZ0U9/exec';

// Función helper para hacer requests
const makeRequest = async (action, data = null) => {
  try {
    // Configuramos el cuerpo de la petición con la acción y los datos
    const payload = JSON.stringify({
      action: action,
      data: data
    });

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow', // Crucial para redirecciones internas de Apps Script
      headers: {
        // Usamos text/plain para evadir el chequeo previo CORS estricto de Google
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error en la operación');
    }

    return result;
  } catch (error) {
    console.error(`Error en ${action}:`, error);
    throw error;
  }
};

// ============================================
// EMPLEADOS
// ============================================

export const getEmployees = async () => {
  const result = await makeRequest('getEmployees');
  return result.data;
};

export const addEmployee = async (employee) => {
  const result = await makeRequest('addEmployee', employee);
  return result;
};

export const updateEmployee = async (employeeId, data) => {
  const result = await makeRequest('updateEmployee', { id: employeeId, data });
  return result;
};

export const deleteEmployee = async (employeeId) => {
  const result = await makeRequest('deleteEmployee', { id: employeeId });
  return result;
};

export const deleteAllData = async () => {
  const result = await makeRequest('deleteAllData');
  return result;
};

// ============================================
// ASISTENCIAS
// ============================================

export const getAttendance = async () => {
  const result = await makeRequest('getAttendance');
  return result.data;
};

export const addAttendance = async (attendance) => {
  const result = await makeRequest('addAttendance', attendance);
  return result;
};

export const updateAttendance = async (attendanceId, data) => {
  const result = await makeRequest('updateAttendance', { id: attendanceId, data });
  return result;
};

// ============================================
// CONFIGURACIÓN
// ============================================

export const getConfig = async () => {
  const result = await makeRequest('getConfig');
  return result.data;
};

export const updateConfig = async (config) => {
  const result = await makeRequest('updateConfig', config);
  return result;
};

// ============================================
// AUTENTICACIÓN
// ============================================

export const login = async (email, password) => {
  const result = await makeRequest('login', { email, password });
  return result;
};