// src/services/appsScriptService.js
// IMPORTANTE: Adaptado para esquema normalizado (Llaves Foráneas)

import { supabase } from './supabaseClient';

const handleResponse = (error, data = null) => {
  if (error) {
    console.error('[Supabase Error]:', error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
};

// ============================================
// EMPLEADOS
// ============================================

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('empleados')
    .select(`
      *,
      sedes(nombre),
      areas(nombre),
      cargos(nombre),
      turnos(nombre)
    `)
    .order('fecha_creacion', { ascending: true });
  
  if (error) {
    console.error('Error getEmployees:', error);
    return [];
  }
  
  // Aplanamos las relaciones para la UI
  return data.map(emp => ({
    ...emp,
    qrCode: emp.qr_code,
    fechaCreacion: emp.fecha_creacion,
    sede: emp.sedes?.nombre || '',
    area: emp.areas?.nombre || '',
    cargo: emp.cargos?.nombre || '',
    turno: emp.turnos?.nombre || 'Mañana',
    foto_url: emp.foto_url || null
  }));
};

export const uploadProfilePhoto = async (file, employeeId) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${employeeId}-${Date.now()}.${fileExt}`;
  const filePath = `perfiles/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('fotos_perfil')
    .upload(filePath, file);

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data } = supabase.storage
    .from('fotos_perfil')
    .getPublicUrl(filePath);

  return { success: true, url: data.publicUrl };
};

// Función auxiliar para obtener ID por nombre (crea si no existe)
// Usa upsert con onConflict para evitar error 409 si el registro ya existe
const getOrCreateId = async (table, nombre) => {
  if (!nombre) return null;

  // 1. Intentar obtener el ID existente primero
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('nombre', nombre)
    .maybeSingle();

  if (existing) return existing.id;

  // 2. Si no existe, hacer upsert para evitar race conditions / 409 Conflict
  const { data: upserted, error } = await supabase
    .from(table)
    .upsert([{ nombre }], { onConflict: 'nombre', ignoreDuplicates: false })
    .select('id')
    .single();

  if (error) {
    // Si aún así falla (ej: la restricción no es en 'nombre'), intentar leer de nuevo
    console.warn(`[getOrCreateId] upsert falló en tabla '${table}':`, error.message);
    const { data: fallback } = await supabase
      .from(table)
      .select('id')
      .eq('nombre', nombre)
      .maybeSingle();
    return fallback?.id || null;
  }

  return upserted?.id || null;
};

export const addEmployee = async (employee) => {
  const sede_id = await getOrCreateId('sedes', employee.sede);
  const area_id = await getOrCreateId('areas', employee.area);
  const cargo_id = await getOrCreateId('cargos', employee.cargo);
  const turno_id = await getOrCreateId('turnos', employee.turno || 'Mañana');

  const dbEmployee = {
    id: employee.id,
    nombre: employee.nombre,
    apellido: employee.apellido,
    email: employee.email,
    telefono: employee.telefono,
    activo: employee.activo,
    qr_code: employee.qrCode,
    fecha_creacion: employee.fechaCreacion,
    foto_url: employee.foto_url,
    sede_id,
    area_id,
    cargo_id,
    turno_id
  };

  const { data, error } = await supabase.from('empleados').insert([dbEmployee]);
  return handleResponse(error, data);
};

export const updateEmployee = async (employeeId, data) => {
  const updatePayload = {};

  if (data.nombre !== undefined) updatePayload.nombre = data.nombre;
  if (data.apellido !== undefined) updatePayload.apellido = data.apellido;
  if (data.email !== undefined) updatePayload.email = data.email;
  if (data.telefono !== undefined) updatePayload.telefono = data.telefono;
  if (data.activo !== undefined) updatePayload.activo = data.activo;
  if (data.qrCode !== undefined) updatePayload.qr_code = data.qrCode;
  if (data.fechaCreacion !== undefined) updatePayload.fecha_creacion = data.fechaCreacion;
  if (data.foto_url !== undefined) updatePayload.foto_url = data.foto_url;

  if (data.sede !== undefined) updatePayload.sede_id = await getOrCreateId('sedes', data.sede);
  if (data.area !== undefined) updatePayload.area_id = await getOrCreateId('areas', data.area);
  if (data.cargo !== undefined) updatePayload.cargo_id = await getOrCreateId('cargos', data.cargo);
  if (data.turno !== undefined) updatePayload.turno_id = await getOrCreateId('turnos', data.turno);

  const { error } = await supabase.from('empleados').update(updatePayload).eq('id', employeeId);
  return handleResponse(error);
};

export const deleteEmployee = async (employeeId) => {
  const { error } = await supabase.from('empleados').delete().eq('id', employeeId);
  return handleResponse(error);
};

export const deleteAllData = async () => {
  await supabase.from('registros_academicos').delete().neq('id', '');
  await supabase.from('asistencias').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error } = await supabase.from('empleados').delete().neq('id', '');
  return handleResponse(error);
};

// ============================================
// ASISTENCIAS
// ============================================

export const getAttendance = async () => {
  const { data, error } = await supabase
    .from('asistencias')
    .select('*')
    .order('fecha', { ascending: false })
    .order('hora_entrada', { ascending: false });

  if (error) {
    console.error('Error getAttendance:', error);
    return [];
  }

  return data.map(a => ({
    ...a,
    employeeId: a.employee_id,
    horaEntrada: a.hora_entrada,
    horaSalida: a.hora_salida,
    metodoRegistro: a.metodo_registro,
    registradoPor: a.registrado_por
  }));
};

export const addAttendance = async (payload) => {
  const { employeeId, metodoRegistro, registradoPor } = payload;
  
  const now = new Date();
  const fecha = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  // Obtener todos los registros del empleado para el día de hoy ordenados por entrada desc
  const { data: existingRecords } = await supabase
    .from('asistencias')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('fecha', fecha)
    .order('hora_entrada', { ascending: false });

  const { data: emp } = await supabase
    .from('empleados')
    .select('turnos(nombre, hora_entrada)')
    .eq('id', employeeId)
    .maybeSingle();

  const nombreTurno = emp?.turnos?.nombre || '';
  const horaEntradaTurno = emp?.turnos?.hora_entrada;
  const [hReal] = timeStr.split(':').map(Number);

  const lastRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

  // Si ya tiene un registro hoy, no se permite registrar de nuevo
  if (lastRecord) {
    return { success: false, error: 'Ya registró asistencia hoy' };
  }

  // === LÓGICA DE CÁLCULO DE ESTADO ===
  let estadoAsistencia = 'Presente';
  
  // En Doble Turno (tarde >= 13:00) o Turno Tarde, NO existe tardanza: siempre es 'Presente' (simplemente asistió)
  const esTardeDobleTurno = (nombreTurno === 'Doble Turno' && hReal >= 13);
  const turnoSinTardanza = nombreTurno === 'Tarde' || esTardeDobleTurno;

  if (!turnoSinTardanza) {
    // Para Turno Mañana y la Mañana del Doble Turno: se respeta el horario de configuración y la tolerancia
    const { data: conf } = await supabase.from('configuracion').select('hora_entrada, tolerancia_minutos').limit(1).maybeSingle();
    const horaEsperada = horaEntradaTurno || conf?.hora_entrada || '08:00';
    const toleranciaMinutos = conf?.tolerancia_minutos || 15;

    // Hora límite = hora de entrada esperada (del turno o configuración) + tolerancia
    const entradaEsperadaDate = new Date(`${fecha}T${horaEsperada}`);
    entradaEsperadaDate.setMinutes(entradaEsperadaDate.getMinutes() + toleranciaMinutos);

    // Hora real en que el usuario está registrando
    const horaRealDate = new Date(`${fecha}T${timeStr}:00`);

    if (horaRealDate > entradaEsperadaDate) {
      estadoAsistencia = 'Tardanza';
    }
  }

  const newRecord = {
    employee_id: employeeId,
    fecha: fecha,
    hora_entrada: timeStr,
    metodo_registro: metodoRegistro,
    registrado_por: registradoPor,
    estado: estadoAsistencia
  };
  
  const { error } = await supabase.from('asistencias').insert([newRecord]);
  if (error) return handleResponse(error);
  return { success: true, data: { action: 'ENTRADA' } };
};

export const saveJustification = async (payload) => {
  const { employeeId, fecha, justificacion, registradoPor } = payload;
  
  const { data: existing } = await supabase
    .from('asistencias')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('fecha', fecha)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('asistencias').update({ justificacion, estado: 'Justificado' }).eq('id', existing.id);
    return handleResponse(error);
  } else {
    const { error } = await supabase.from('asistencias').insert([{
      employee_id: employeeId, fecha, justificacion, registrado_por: registradoPor, estado: 'Justificado'
    }]);
    return handleResponse(error);
  }
};

export const updateAttendance = async (attendanceId, data) => {
  const dbData = { ...data };
  if (dbData.horaEntrada) { dbData.hora_entrada = dbData.horaEntrada; delete dbData.horaEntrada; }
  if (dbData.horaSalida) { dbData.hora_salida = dbData.horaSalida; delete dbData.horaSalida; }

  const { error } = await supabase.from('asistencias').update(dbData).eq('id', attendanceId);
  return handleResponse(error);
};

// ============================================
// CONFIGURACIÓN
// ============================================

export const getConfig = async () => {
  const { data: conf, error } = await supabase.from('configuracion').select('*').limit(1).maybeSingle();
  if (error || !conf) return null;
  
  // Sincronizamos las áreas y sedes para la UI leyendo directamente las tablas normalizadas
  const { data: areasData } = await supabase.from('areas').select('nombre');
  const { data: sedesData } = await supabase.from('sedes').select('nombre');
  const { data: turnosData } = await supabase.from('turnos').select('nombre, hora_entrada, hora_salida');

  return {
    ...conf,
    nombreEntidad: conf.nombre_entidad,
    nombreEntidadSingular: conf.nombre_entidad_singular,
    nombreEntidadPlural: conf.nombre_entidad_plural,
    toleranciaMinutos: conf.tolerancia_minutos,
    diasLaborales: typeof conf.dias_laborales === 'string' ? JSON.parse(conf.dias_laborales) : conf.dias_laborales,
    areas: areasData ? areasData.map(a => a.nombre) : [],
    sedes: sedesData ? sedesData.map(s => s.nombre) : [],
    turnos: turnosData || []
  };
};

export const updateConfig = async (config) => {
  const { data: existing } = await supabase.from('configuracion').select('id').limit(1).maybeSingle();
  
  const dbConfig = {
    nombre_entidad: config.nombreEntidad,
    nombre_entidad_singular: config.nombreEntidadSingular,
    nombre_entidad_plural: config.nombreEntidadPlural,
    tolerancia_minutos: config.toleranciaMinutos,
    dias_laborales: config.diasLaborales,
  };

  if (existing) {
    await supabase.from('configuracion').update(dbConfig).eq('id', existing.id);
  } else {
    await supabase.from('configuracion').insert([dbConfig]);
  }

  // Sincronizar Áreas y Sedes (Inserta los nuevos)
  const areasArray = Array.isArray(config.areas) ? config.areas : (typeof config.areas === 'string' ? JSON.parse(config.areas) : []);
  if (areasArray.length > 0) {
    for (const a of areasArray) { await getOrCreateId('areas', a); }
  }

  const sedesArray = Array.isArray(config.sedes) ? config.sedes : (typeof config.sedes === 'string' ? JSON.parse(config.sedes) : []);
  if (sedesArray.length > 0) {
    for (const s of sedesArray) { await getOrCreateId('sedes', s); }
  }

  // Sincronizar Turnos (Acepta nombre y horarios)
  if (config.turnos && Array.isArray(config.turnos)) {
    // Obtener turnos actuales en la BD para detectar cuáles se eliminaron
    const { data: turnosEnBD } = await supabase.from('turnos').select('id, nombre');
    const nombresTurnosNuevos = config.turnos.map(t => t.nombre).filter(Boolean);

    // Eliminar los turnos que ya no están en la nueva lista
    if (turnosEnBD) {
      const turnosAEliminar = turnosEnBD.filter(t => !nombresTurnosNuevos.includes(t.nombre));
      for (const t of turnosAEliminar) {
        await supabase.from('turnos').delete().eq('id', t.id);
      }
    }

    // Insertar o actualizar los turnos que sí están en la lista
    for (const t of config.turnos) {
      if (!t.nombre) continue;
      const { data: existingTurno } = await supabase.from('turnos').select('id').eq('nombre', t.nombre).maybeSingle();
      if (existingTurno) {
        await supabase.from('turnos').update({ hora_entrada: t.hora_entrada, hora_salida: t.hora_salida }).eq('id', existingTurno.id);
      } else {
        await supabase.from('turnos').insert([{ nombre: t.nombre, hora_entrada: t.hora_entrada, hora_salida: t.hora_salida }]);
      }
    }
  }

  return { success: true };
};

// ============================================
// ACADÉMICO (NOTAS)
// ============================================

export const getAcademicRecords = async () => {
  const { data, error } = await supabase.from('registros_academicos').select('*');
  if (error) return [];
  
  return data.map(r => ({
    ...r,
    ID_Alumno: r.id_alumno,
    Mes: r.mes,
    ...r.datos_nota
  }));
};

export const saveAcademicRecord = async (data) => {
  const { ID_Alumno, Mes, ID, ...datosNota } = data;
  
  const { data: existing } = await supabase
    .from('registros_academicos')
    .select('id')
    .eq('id_alumno', ID_Alumno)
    .eq('mes', Mes)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('registros_academicos').update({ datos_nota: datosNota }).eq('id', existing.id);
    return handleResponse(error);
  } else {
    const { error } = await supabase.from('registros_academicos').insert([{
      id: ID || ('AC' + Date.now()),
      id_alumno: ID_Alumno,
      mes: Mes,
      datos_nota: datosNota
    }]);
    return handleResponse(error);
  }
};

// ============================================
// AUTENTICACIÓN
// ============================================

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };

  return { 
    success: true, 
    data: {
      id: data.user.id,
      email: data.user.email,
      nombre: data.user.user_metadata?.nombre || 'Administrador',
      rol: 'admin'
    } 
  };
};

// ============================================
// MANTENEDOR DE USUARIOS ADMINISTRADORES
// ============================================

export const getAdminUsers = async () => {
  const { data, error } = await supabase.from('perfiles').select('*').order('created_at', { ascending: false });
  if (error) {
    return [];
  }
  return data;
};

export const createAdminUser = async (email, password, nombre) => {
  try {
    // 1. Invocar la Edge Function para crear el usuario en Supabase Auth
    // Nota: Reemplaza tu_id_de_proyecto si es necesario o asegúrate de que supabase.functions funcione
    const { data, error } = await supabase.functions.invoke('create-admin', {
      body: { email, password, nombre }
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateAdminUser = async (id, email, password, nombre) => {
  try {
    const { data, error } = await supabase.functions.invoke('update-admin', {
      body: { id, email, password, nombre }
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteAdminUser = async (id) => {
  // Nota: Eliminar un usuario de perfiles asume que hay un trigger o se maneja a nivel bd
  // Para eliminar de Auth se necesitaría otra llamada al Admin API en la Edge Function,
  // Por simplicidad en este MVP, eliminamos el perfil (le quita el acceso si validas rol).
  const { error } = await supabase.from('perfiles').delete().eq('id', id);
  return handleResponse(error);
};