// evaluator_core.js
// Lógica pura del evaluador (sin DOM). Diseñado para ser idéntico a la lógica original
// del `calculateScore()` en `index.html`. Permite reutilizar en frontend y portar a Apps Script.

export function evaluate(state) {
    const perfil = state.perfil || 'ADMIN';
    const selects = state.selects || {};

    const maxOf = (opts) => opts && opts.length ? Math.max(...opts.map(o => parseInt(o.value) || 0)) : 0;

    // Sumar puntos crudos
    let total = 0;
    Object.values(selects).forEach(s => { total += parseInt(s.value) || 0; });

    // Antigüedad (50%)
    const antig = selects['antiguedad'] || { value: 0, options: [] };
    const antigRaw = parseInt(antig.value) || 0;
    const antigMax = maxOf(antig.options || []);
    const antigPercent = antigMax > 0 ? (antigRaw / antigMax) * 100 : 0;
    const antigWeighted50 = Math.round((antigPercent / 100) * 50);

    // Estado Físico (35%)
    const estadoKeys = ['carcasa', 'teclado', 'pantalla', 'bateria', 'usb', 'carga', 'hdmi', 'red', 'audio', 'camara'];
    let estadoRaw = 0, estadoMax = 0;
    estadoKeys.forEach(k => {
        const s = selects[k];
        if (s) {
            estadoRaw += parseInt(s.value) || 0;
            estadoMax += maxOf(s.options || []);
        }
    });
    const estadoPercent = estadoMax > 0 ? (estadoRaw / estadoMax) * 100 : 0;
    const estadoWeighted35 = Math.round((estadoPercent / 100) * 35);

    // Rendimiento Interno (15%)
    const gpuValNow = (selects['video'] && selects['video'].value) || null;
    let rendimientoKeys = ['enciende', 'ram', 'disco', 'video'];
    if (perfil === 'ADMIN' && (gpuValNow === '0' || gpuValNow === 0)) rendimientoKeys = ['enciende', 'ram', 'disco'];
    let rendRaw = 0, rendMax = 0;
    rendimientoKeys.forEach(k => {
        const s = selects[k];
        if (s) {
            rendRaw += parseInt(s.value) || 0;
            rendMax += maxOf(s.options || []);
        }
    });
    const rendPercent = rendMax > 0 ? (rendRaw / rendMax) * 100 : 0;
    const rendWeighted15 = Math.round((rendPercent / 100) * 15);

    const weightedTotal = (antigWeighted50 || 0) + (estadoWeighted35 || 0) + (rendWeighted15 || 0);

    // Mensajes y reglas (manteniendo exactamente los textos originales)
    const messages = [];
    let noReasignable = false;

    const discoVal = (selects['disco'] && selects['disco'].value) || null;
    if (discoVal === '1') messages.push({ type: 'warning', text: 'Disco Duro: Evaluar antigüedad y estado físico del equipo para cambiar a Disco SSD.' });
    else if (discoVal == '6') {
        if (perfil === 'CAD_BIM') messages.push({ type: 'error', text: 'Disco Duro: Insuficiente para CAD/BIM, se requiere aumentar.' });
        else messages.push({ type: 'warning', text: 'Disco Duro: Se requiere mantener / aumentar según antigüedad o categoría del equipo.' });
    }

    const bateriaVal = (selects['bateria'] && selects['bateria'].value) || null;
    if (bateriaVal === '10') messages.push({ type: 'info', text: 'Batería excelente, poco uso.' });
    else if (bateriaVal === '6') messages.push({ type: 'info', text: 'Batería buena, degradación leve.' });
    else if (bateriaVal === '3') messages.push({ type: 'warning', text: 'Batería Aceptable / Gastada.' });
    else if (bateriaVal === '1') messages.push({ type: 'warning', text: 'Batería degradada, es recomendable cambiar según antigüedad del equipo.' });
    else if (bateriaVal === '0') messages.push({ type: 'critical', text: 'Batería muy gastada, es recomendable cambiar según antigüedad del equipo.' });

    const usbVal = (selects['usb'] && selects['usb'].value) || null;
    if (usbVal === '1') messages.push({ type: 'warning', text: 'USB: Evaluar antigüedad y estado físico del equipo para salvar puerto USB o mandar a Reciclaje / Préstamo.' });

    const carcVal = (selects['carcasa'] && selects['carcasa'].value) || null;
    if (parseInt(carcVal) <= 1) messages.push({ type: 'warning', text: 'Carcasa: Evaluar equipo según su antigüedad para Préstamo o Reciclaje.' });

    const teclaVal = (selects['teclado'] && selects['teclado'].value) || null;
    if (parseInt(teclaVal) <= 1) messages.push({ type: 'warning', text: 'Teclado: Evaluar equipo según su antigüedad para Préstamo o Reciclaje.' });

    const pantVal = (selects['pantalla'] && selects['pantalla'].value) || null;
    if (parseInt(pantVal) <= 1) messages.push({ type: 'warning', text: 'Pantalla: Evaluar equipo según su antigüedad para Préstamo o Reciclaje.' });

    const cargaVal = (selects['carga'] && selects['carga'].value) || null;
    if (cargaVal === '6') messages.push({ type: 'warning', text: 'Puerto Carga: Puerto principal delicado, revisar para mantención según antigüedad, o mandar a Reciclaje / Préstamo.' });
    if (cargaVal === '1') messages.push({ type: 'warning', text: 'Puerto Carga: Evaluar antigüedad del equipo para salvar puerto o mandar a Reciclaje / Préstamo.' });

    const redVal = (selects['red'] && selects['red'].value) || null;
    if (redVal === '1') messages.push({ type: 'warning', text: 'Puerto Red: Evaluar antigüedad y estado físico del equipo para salvar Puerto de Red, o mandar a Reciclaje / Préstamo.' });

    const hdmiVal = (selects['hdmi'] && selects['hdmi'].value) || null;
    if (hdmiVal === '1') messages.push({ type: 'warning', text: 'Puerto HDMI: Evaluar antigüedad y estado físico del equipo para salvar puerto HDMI, o mandar a Reciclaje / Préstamo.' });

    const audioVal = (selects['audio'] && selects['audio'].value) || null;
    if (audioVal === '1') messages.push({ type: 'warning', text: 'Audio: Evaluar antigüedad y estado físico del equipo para salvar el estado del audio, o mandar a Reciclaje / Préstamo.' });

    const camVal = (selects['camara'] && selects['camara'].value) || null;
    if (camVal === '1') messages.push({ type: 'warning', text: 'Cámara: Evaluar antigüedad y estado físico del equipo para salvar la cámara, o mandar a Reciclaje / Préstamo.' });

    const enciendeVal = (selects['enciende'] && selects['enciende'].value) || null;
    if (enciendeVal === '0') { messages.push({ type: 'error', text: '¿Enciende?: No enciende, mandar equipo a Reciclaje.' }); noReasignable = true; }

    const ramVal = (selects['ram'] && selects['ram'].value) || null;
    if (perfil === 'ADMIN' && parseInt(ramVal) < 6) messages.push({ type: 'info', text: 'Upgrade RAM: Subir ≥ a 16GB para mejor desempeño.' });
    if (perfil === 'CAD_BIM' && parseInt(ramVal) < 6) messages.push({ type: 'critical', text: 'Memoria RAM: Upgrade de RAM obligatorio para CAD/BIM a ≥ 16GB.' });
    if (ramVal === '0') messages.push({ type: 'warning', text: 'Evaluar antigüedad y estado físico del equipo para colocar RAM o mandar equipo a Reciclaje / Préstamo.' });

    const gpuVal = (selects['video'] && selects['video'].value) || null;
    if (gpuVal === '2') messages.push({ type: 'info', text: 'GPU limitada.' });
    if (perfil === 'CAD_BIM' && parseInt(gpuVal) < 6) messages.push({ type: 'error', text: 'GPU: Insuficiente para CAD/BIM.' });

    // Antigüedad con selectedIndex si se provee
    const antigSelectedIndex = (selects['antiguedad'] && typeof selects['antiguedad'].selectedIndex !== 'undefined') ? selects['antiguedad'].selectedIndex : null;
    if (antigSelectedIndex === 3) { messages.push({ type: 'error', text: 'EQUIPO: Antigüedad 7–8 años — Fin de vida útil operativa. No apto para reasignación. Priorizar reciclaje o préstamo. ' }); noReasignable = true; }
    if (antigSelectedIndex === 4) { messages.push({ type: 'error', text: 'EQUIPO: Antigüedad 9–10 años — Fin de vida útil operativa. No apto para reasignación. Priorizar reciclaje o préstamo.' }); noReasignable = true; }

    // Preparar filas de tabla si se entrega orden
    const tableRows = [];
    if (state.tableOrder && Array.isArray(state.tableOrder)) {
        state.tableOrder.forEach(r => {
            const key = r.key;
            const sel = selects[key];
            if (sel) tableRows.push({ criterio: r.label, condicion: sel.selectedText || '', puntos: String(sel.value || '') });
        });
    }

    let status = '';
    if (noReasignable) status = 'CANDIDATO A RECICLAJE';
    else if (weightedTotal >= 55) status = 'CANDIDATO A REASIGNACIÓN';
    else if (weightedTotal >= 40) status = 'CANDIDATO A PRÉSTAMO';
    else status = 'CANDIDATO A RECICLAJE';

    return {
        weightedTotal,
        antig: { raw: antigRaw, max: antigMax, percent: antigPercent, weighted: antigWeighted50 },
        estado: { raw: estadoRaw, max: estadoMax, percent: estadoPercent, weighted: estadoWeighted35 },
        rendimiento: { raw: rendRaw, max: rendMax, percent: rendPercent, weighted: rendWeighted15 },
        messages,
        noReasignable,
        status,
        tableRows
    };
}

export function generatePdfHtml(result, meta) {
    const fecha = new Date().toLocaleString('es-CL');
    const recomendaciones = (result.messages && result.messages.length)
        ? result.messages.map(m => `<li>${m.text}</li>`).join('')
        : '<li>Sin observaciones</li>';

    const tablaHTML = (result.tableRows || []).map(r => `
        <tr>
            <td>${r.criterio}</td>
            <td>${r.condicion}</td>
            <td style="text-align:center;">${r.puntos}</td>
        </tr>
    `).join('');

    return `
    <div style="font-family: Inter, sans-serif; padding:25px;">
        <h1 style="font-size:28px; font-weight:800; color:#1e3a8a;">Evaluador TI</h1>
        <p style="color:#6b7280;">Reporte técnico generado automáticamente</p>
        <p style="font-size:12px; color:#6b7280;">Fecha de generación: ${fecha}</p>

        <div style="display:flex; gap:20px; align-items:stretch; margin-top:30px;">
            <div style="flex:1; padding:20px; border-radius:12px; background:#f9fafb; display:flex; flex-direction:column; justify-content:center;">
                <h2 style="font-weight:700; margin-bottom:10px;">Información del Activo</h2>
                <p><strong>N° Activo:</strong> ${meta.activo || 'No especificado'}</p>
                <p><strong>N° Serie:</strong> ${meta.serie || 'No especificado'}</p>
                <p><strong>Perfil:</strong> ${meta.perfilTexto || ''}</p>
            </div>

            <div style="width:320px; padding:20px; border-radius:12px; background:#e0f2fe; display:flex; flex-direction:column; justify-content:center;">
                <h2 style="font-weight:700; margin:0 0 8px 0;">Resultado Final</h2>
                <p style="font-size:26px; font-weight:800; margin:0;">${result.weightedTotal}%</p>
                <p style="font-weight:700; margin-top:8px;">${result.status}</p>
            </div>
        </div>

        <div style="margin-top:20px;">
            <h2 style="font-weight:700;">Desglose de Ponderaciones</h2>
            <ul>
                <li>Antigüedad (50%): ${result.antig.raw}</li>
                <li>Estado Físico (35%): ${result.estado.raw}</li>
                <li>Rendimiento Interno (15%): ${result.rendimiento.raw}</li>
            </ul>
        </div>

        <div style="margin-top:20px;">
            <h2 style="font-weight:700;">Recomendaciones TI</h2>
            <ul>${recomendaciones}</ul>
        </div>

        <div style="margin-top:20px;">
            <h2 style="font-weight:700;">Detalle de Evaluación</h2>
            <table style="width:100%; border-collapse:collapse; font-size:10px;">
                <thead>
                    <tr style="background:#1e293b; color:white;">
                        <th style="padding:8px;">Criterio</th>
                        <th style="padding:8px;">Condición</th>
                        <th style="padding:8px;">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    ${tablaHTML}
                </tbody>
            </table>
        </div>
    </div>
    `;
}
