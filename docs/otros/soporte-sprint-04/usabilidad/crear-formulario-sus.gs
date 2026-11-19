/**
 * Crea en Google Forms el formulario SUS del Sprint 4 (EcoRuta Huancayo) y su hoja de respuestas.
 * Uso: https://script.google.com → Nuevo proyecto → pegar este código → seleccionar crearFormularioSUS → Ejecutar.
 * Al terminar, el registro de ejecución muestra el enlace para responder y el enlace de edición.
 * Contenido equivalente a «Formulario SUS V_1_0_0.md».
 */
function crearFormularioSUS() {
  const form = FormApp.create('Evaluación de usabilidad — EcoRuta Huancayo');
  form.setDescription(
    'Gracias por participar. Acabas de usar EcoRuta Huancayo, una plataforma para planificar y seguir entregas de última milla. ' +
    'Responde según tu propia experiencia; no hay respuestas correctas ni incorrectas, y lo que se evalúa es el sistema, no a ti. ' +
    'Las respuestas son anónimas y solo se usan para el informe de usabilidad del curso Taller de Proyectos 2. Tiempo estimado: 3 minutos.'
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);
  form.setShowLinkToRespondAgain(false);

  // Sección 1: datos de la sesión (la completa el evaluador).
  form.addSectionHeaderItem().setTitle('1. Datos de la sesión').setHelpText('Esta sección la completa el evaluador.');
  form.addTextItem().setTitle('Código del participante').setHelpText('P1, P2, P3…').setRequired(true)
    .setValidation(FormApp.createTextValidation().requireTextMatchesPattern('^P[0-9]+$').setHelpText('Usa el formato P1, P2, P3…').build());
  form.addMultipleChoiceItem().setTitle('Perfil evaluado').setChoiceValues(['Operador', 'Conductor']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Entorno').setChoiceValues(['Sistema desplegado', 'Entorno local del equipo']).setRequired(true);
  const tareas = ['T1', 'T2', 'T3', 'T4', 'T5'];
  form.addCheckboxItem().setTitle('Tareas completadas sin ayuda').setHelpText('Marca solo las completadas sin ayuda del evaluador.').setChoiceValues(tareas);
  form.addCheckboxItem().setTitle('Tareas que necesitaron ayuda').setChoiceValues(tareas.concat(['Ninguna']));

  // Sección 2: consentimiento.
  form.addPageBreakItem().setTitle('2. Consentimiento');
  form.addMultipleChoiceItem()
    .setTitle('Acepto que mis respuestas anónimas se usen en el informe de usabilidad del proyecto')
    .setChoiceValues(['Sí, acepto']).setRequired(true);

  // Sección 3: SUS. El orden importa: la fórmula depende de la posición de cada ítem.
  form.addPageBreakItem().setTitle('3. Cuestionario').setHelpText('1 = Totalmente en desacuerdo · 5 = Totalmente de acuerdo');
  [
    'Creo que me gustaría usar este sistema con frecuencia.',
    'Encontré el sistema innecesariamente complejo.',
    'Pensé que el sistema era fácil de usar.',
    'Creo que necesitaría la ayuda de una persona con conocimientos técnicos para poder usar este sistema.',
    'Encontré que las distintas funciones del sistema estaban bien integradas.',
    'Pensé que había demasiada inconsistencia en este sistema.',
    'Imagino que la mayoría de las personas aprenderían a usar este sistema muy rápidamente.',
    'Encontré el sistema muy engorroso de usar.',
    'Me sentí muy seguro/a usando el sistema.',
    'Necesité aprender muchas cosas antes de poder empezar a usar este sistema.',
  ].forEach((texto, i) => {
    form.addScaleItem().setTitle(`${i + 1}. ${texto}`).setBounds(1, 5)
      .setLabels('Totalmente en desacuerdo', 'Totalmente de acuerdo').setRequired(true);
  });

  // Sección 4: comentarios.
  form.addPageBreakItem().setTitle('4. Comentarios (opcional)');
  form.addParagraphTextItem().setTitle('¿Qué fue lo más difícil o confuso al usar el sistema?');
  form.addParagraphTextItem().setTitle('¿Qué cambiarías primero?');

  const hoja = SpreadsheetApp.create('Respuestas SUS — EcoRuta Huancayo');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  Logger.log('Enlace para responder: ' + form.getPublishedUrl());
  Logger.log('Enlace para editar:    ' + form.getEditUrl());
  Logger.log('Hoja de respuestas:     ' + hoja.getUrl());
}

/**
 * Exporta las respuestas al formato de respuestas-sus.csv (participante,perfil,p1..p10).
 * Ejecutar cuando haya respuestas; el CSV aparece en el registro de ejecución para copiarlo.
 */
function exportarCsvSUS() {
  const forms = DriveApp.getFilesByName('Evaluación de usabilidad — EcoRuta Huancayo');
  if (!forms.hasNext()) throw new Error('No se encontró el formulario.');
  const form = FormApp.openById(forms.next().getId());
  const lineas = ['participante,perfil,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10'];
  form.getResponses().forEach(respuesta => {
    const valores = {};
    respuesta.getItemResponses().forEach(item => { valores[item.getItem().getTitle()] = item.getResponse(); });
    const sus = Object.keys(valores).filter(titulo => /^\d+\. /.test(titulo))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).map(titulo => valores[titulo]);
    lineas.push([valores['Código del participante'], valores['Perfil evaluado']].concat(sus).join(','));
  });
  Logger.log(lineas.join('\n'));
}
