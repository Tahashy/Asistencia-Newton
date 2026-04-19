// src/services/appsScriptService.js

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8Y7QVmAaIjoemko7B5fVBkNC3mGvyl1K0tAEHV2dLEvrkw8z2dVtQwuUd5dRdsaON/exec';

// Función helper para hacer requests
const makeRequest = async (action, data = null) => {
  try {
    console.log(`[API] Solicitando ${action}...`, data);
    const payload = JSON.stringify({ action, data });

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[API] Respuesta de ${action}:`, result);

    if (result.success === false) {
      throw new Error(result.error || 'Error en la operación');
    }

    // Si el éxito viene anidado en data (v6.5)
    if (result.data && result.data.success === false) {
      throw new Error(result.data.error || 'Error interno en el servidor');
    }

    return result;
  } catch (error) {
    console.error(`[API ERROR] En ${action}:`, error);
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

export const saveJustification = async (payload) => {
  const result = await makeRequest('saveJustification', payload);
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
// ACADÉMICO (NOTAS)
// ============================================

export const getAcademicRecords = async () => {
    const result = await makeRequest('getAcademic');
    return result.data;
};

export const saveAcademicRecord = async (data) => {
    const result = await makeRequest('saveAcademic', data);
    return result;
};

// ============================================
// AUTENTICACIÓN
// ============================================

export const login = async (email, password) => {
  const result = await makeRequest('login', { email, password });
  return result;
};