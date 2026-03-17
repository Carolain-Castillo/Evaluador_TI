/**
 * Version para Google Apps Script: función evaluateStateGS(state)
 * Recibe un objeto 'state' con la misma estructura usada en el front:
 * { perfil: 'ADMIN'|'CAD_BIM', selects: { key: { value, options:[{value,text}] , selectedText, selectedIndex } }, tableOrder: [...] }
 * Devuelve un objeto con weightedTotal, messages, status, etc.
 */
function evaluateStateGS(state) {
  var perfil = (state && state.perfil) || 'ADMIN';
  var selects = (state && state.selects) || {};

  function maxOf(opts){
    if(!opts || !opts.length) return 0;
    var m = 0;
    for(var i=0;i<opts.length;i++){ m = Math.max(m, parseInt(opts[i].value) || 0); }
    return m;
  }

  var total = 0;
  for (var k in selects) { total += parseInt(selects[k].value) || 0; }

  var antig = selects['antiguedad'] || { value:0, options:[] };
  var antigRaw = parseInt(antig.value) || 0;
  var antigMax = maxOf(antig.options || []);
  var antigPercent = antigMax > 0 ? (antigRaw / antigMax) * 100 : 0;
  var antigWeighted50 = Math.round((antigPercent/100)*50);

  var estadoKeys = ['carcasa','teclado','pantalla','bateria','usb','carga','hdmi','red','audio','camara'];
  var estadoRaw=0, estadoMax=0;
  for(var i=0;i<estadoKeys.length;i++){
    var s = selects[estadoKeys[i]];
    if(s){ estadoRaw += parseInt(s.value)||0; estadoMax += maxOf(s.options||[]); }
  }
  var estadoPercent = estadoMax>0 ? (estadoRaw/estadoMax)*100 : 0;
  var estadoWeighted35 = Math.round((estadoPercent/100)*35);

  var gpuValNow = (selects['video'] && selects['video'].value) || null;
  var rendimientoKeys = ['enciende','ram','disco','video'];
  if(perfil==='ADMIN' && (gpuValNow==='0' || gpuValNow===0)) rendimientoKeys = ['enciende','ram','disco'];
  var rendRaw=0, rendMax=0;
  for(var j=0;j<rendimientoKeys.length;j++){ var r = selects[rendimientoKeys[j]]; if(r){ rendRaw += parseInt(r.value)||0; rendMax += maxOf(r.options||[]); } }
  var rendPercent = rendMax>0 ? (rendRaw/rendMax)*100 : 0;
  var rendWeighted15 = Math.round((rendPercent/100)*15);

  var weightedTotal = (antigWeighted50||0) + (estadoWeighted35||0) + (rendWeighted15||0);

  var messages = [];
  var noReasignable = false;

  var discoVal = (selects['disco'] && selects['disco'].value) || null;
  if(discoVal==='1') messages.push({type:'warning', text:'Disco Duro: Evaluar antigüedad y estado físico del equipo para cambiar a Disco SSD.'});
  else if(discoVal==6 || discoVal=='6'){
    if(perfil==='CAD_BIM') messages.push({type:'error', text:'Disco Duro: Insuficiente para CAD/BIM, se requiere aumentar.'});
    else messages.push({type:'warning', text:'Disco Duro: Se requiere mantener / aumentar según antigüedad o categoría del equipo.'});
  }

  var bateriaVal = (selects['bateria'] && selects['bateria'].value) || null;
  if(bateriaVal==='10') messages.push({type:'info', text:'Batería excelente, poco uso.'});
  else if(bateriaVal==='6') messages.push({type:'info', text:'Batería buena, degradación leve.'});
  else if(bateriaVal==='3') messages.push({type:'warning', text:'Batería Aceptable / Gastada.'});
  else if(bateriaVal==='1') messages.push({type:'warning', text:'Batería degradada, es recomendable cambiar según antigüedad del equipo.'});
  else if(bateriaVal==='0') messages.push({type:'critical', text:'Batería muy gastada, es recomendable cambiar según antigüedad del equipo.'});

  var usbVal = (selects['usb'] && selects['usb'].value) || null;
  if(usbVal==='1') messages.push({type:'warning', text:'USB: Evaluar antigüedad y estado físico del equipo para salvar puerto USB o mandar a Reciclaje / Préstamo.'});

  var carcVal = (selects['carcasa'] && selects['carcasa'].value) || null; if(parseInt(carcVal)<=1) messages.push({type:'warning', text:'Carcasa: Evaluar equipo según su antigüedad para Préstamo o Reciclaje.'});
  var teclaVal = (selects['teclado'] && selects['teclado'].value) || null; if(parseInt(teclaVal)<=1) messages.push({type:'warning', text:'Teclado: Evaluar equipo según su antigüedad para Préstamo o Reciclaje.'});
  var pantVal = (selects['pantalla'] && selects['pantalla'].value) || null; if(parseInt(pantVal)<=1) messages.push({type:'warning', text:'Pantalla: Evaluar equipo según su antigüedad para Préstamo o Reciclaje.'});

  var cargaVal = (selects['carga'] && selects['carga'].value) || null; if(cargaVal==='6') messages.push({type:'warning', text:'Puerto Carga: Puerto principal delicado, revisar para mantención según antigüedad, o mandar a Reciclaje / Préstamo.'}); if(cargaVal==='1') messages.push({type:'warning', text:'Puerto Carga: Evaluar antigüedad del equipo para salvar puerto o mandar a Reciclaje / Préstamo.'});

  var redVal = (selects['red'] && selects['red'].value) || null; if(redVal==='1') messages.push({type:'warning', text:'Puerto Red: Evaluar antigüedad y estado físico del equipo para salvar Puerto de Red, o mandar a Reciclaje / Préstamo.'});
  var hdmiVal = (selects['hdmi'] && selects['hdmi'].value) || null; if(hdmiVal==='1') messages.push({type:'warning', text:'Puerto HDMI: Evaluar antigüedad y estado físico del equipo para salvar puerto HDMI, o mandar a Reciclaje / Préstamo.'});
  var audioVal = (selects['audio'] && selects['audio'].value) || null; if(audioVal==='1') messages.push({type:'warning', text:'Audio: Evaluar antigüedad y estado físico del equipo para salvar el estado del audio, o mandar a Reciclaje / Préstamo.'});
  var camVal = (selects['camara'] && selects['camara'].value) || null; if(camVal==='1') messages.push({type:'warning', text:'Cámara: Evaluar antigüedad y estado físico del equipo para salvar la cámara, o mandar a Reciclaje / Préstamo.'});

  var enciendeVal = (selects['enciende'] && selects['enciende'].value) || null; if(enciendeVal==='0'){ messages.push({type:'error', text:'¿Enciende?: No enciende, mandar equipo a Reciclaje.'}); noReasignable = true; }

  var ramVal = (selects['ram'] && selects['ram'].value) || null; if(perfil==='ADMIN' && parseInt(ramVal)<6) messages.push({type:'info', text:'Upgrade RAM: Subir ≥ a 16GB para mejor desempeño.'}); if(perfil==='CAD_BIM' && parseInt(ramVal)<6) messages.push({type:'critical', text:'Memoria RAM: Upgrade de RAM obligatorio para CAD/BIM a ≥ 16GB.'}); if(ramVal==='0') messages.push({type:'warning', text:'Evaluar antigüedad y estado físico del equipo para colocar RAM o mandar equipo a Reciclaje / Préstamo.'});

  var gpuVal = (selects['video'] && selects['video'].value) || null; if(gpuVal==='2') messages.push({type:'info', text:'GPU limitada.'}); if(perfil==='CAD_BIM' && parseInt(gpuVal)<6) messages.push({type:'error', text:'GPU: Insuficiente para CAD/BIM.'});

  var antigIdx = (selects['antiguedad'] && typeof selects['antiguedad'].selectedIndex!=='undefined') ? selects['antiguedad'].selectedIndex : null; if(antigIdx===3){ messages.push({type:'error', text:'EQUIPO: Antigüedad 7–8 años — Fin de vida útil operativa. No apto para reasignación. Priorizar reciclaje o préstamo. '}); noReasignable = true; } if(antigIdx===4){ messages.push({type:'error', text:'EQUIPO: Antigüedad 9–10 años — Fin de vida útil operativa. No apto para reasignación. Priorizar reciclaje o préstamo.'}); noReasignable = true; }

  var tableRows = [];
  if(state.tableOrder && state.tableOrder.length){
    for(var t=0;t<state.tableOrder.length;t++){
      var r = state.tableOrder[t]; var sel = selects[r.key]; if(sel) tableRows.push({criterio:r.label, condicion: sel.selectedText||'', puntos: String(sel.value||'')});
    }
  }

  var status = '';
  if(noReasignable) status = 'CANDIDATO A RECICLAJE';
  else if(weightedTotal>=55) status = 'CANDIDATO A REASIGNACIÓN';
  else if(weightedTotal>=40) status = 'CANDIDATO A PRÉSTAMO';
  else status = 'CANDIDATO A RECICLAJE';

  return { weightedTotal: weightedTotal, antig: {raw: antigRaw, max: antigMax, percent: antigPercent, weighted: antigWeighted50}, estado: {raw: estadoRaw, max: estadoMax, percent: estadoPercent, weighted: estadoWeighted35}, rendimiento: {raw: rendRaw, max: rendMax, percent: rendPercent, weighted: rendWeighted15}, messages: messages, noReasignable: noReasignable, status: status, tableRows: tableRows };
}
